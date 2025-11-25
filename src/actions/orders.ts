'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getOrders({
    page = 1,
    limit = 10,
    search,
    status,
    type,
    sortBy = 'createdAt',
    sortOrder = 'desc',
}: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return {
            data: [],
            meta: {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            },
        };
    }

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
        restaurantId: session.user.restaurantId,
        ...(search && {
            OR: [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
            ],
        }),
        ...(status && { status }),
        ...(type && { type }),
    };

    // Build orderBy based on sortBy parameter
    const orderBy: Prisma.OrderOrderByWithRelationInput =
        sortBy === 'table'
            ? { table: { number: sortOrder } }
            : { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                table: true,
                user: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        }),
        prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
        },
    };
}

export async function createOrder(data: {
    items: {
        productId: string;
        variantId?: string;
        quantity: number;
        notes?: string;
        modifiers: {
            modifierId: string;
            price: number;
            quantity: number;
        }[];
        price: number;
    }[];
    total: number;
    subtotal: number;
    tax: number;
    tableId?: string;
}) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        // Validate table if provided
        if (data.tableId) {
            const table = await prisma.table.findFirst({
                where: {
                    id: data.tableId,
                    restaurantId: session.user.restaurantId,
                },
            });

            if (!table) {
                return { success: false, error: 'Mesa no válida' };
            }

            // Check if table is already occupied
            if (table.status === 'OCCUPIED') {
                return { success: false, error: 'La mesa ya está ocupada' };
            }
        }

        // Generate Order Number (Simple counter for now, could be improved)
        const count = await prisma.order.count({
            where: { restaurantId: session.user.restaurantId },
        });
        const orderNumber = `O-${(count + 1).toString().padStart(4, '0')}`;
        const paymentCode = `PAY-${(count + 1).toString().padStart(4, '0')}`;

        const order = await prisma.order.create({
            data: {
                restaurantId: session.user.restaurantId,
                orderNumber,
                paymentCode,
                status: 'PENDING',
                paymentStatus: 'PENDING',
                type: 'DINE_IN', // Default for now, could be passed in
                subtotal: data.subtotal,
                tax: data.tax,
                total: data.total,
                userId: session.user.id,
                tableId: data.tableId,
                items: {
                    create: data.items.map((item) => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        subtotal: (item.price * item.quantity) + (item.modifiers.reduce((acc, mod) => acc + (mod.price * mod.quantity), 0) * item.quantity),
                        notes: item.notes,
                        modifiers: {
                            create: item.modifiers.map((mod) => ({
                                modifierId: mod.modifierId,
                                price: mod.price,
                                quantity: mod.quantity,
                            })),
                        },
                    })),
                },
            },
        });

        // Update table status to OCCUPIED if a table was assigned
        if (data.tableId) {
            await prisma.table.update({
                where: { id: data.tableId },
                data: { status: 'OCCUPIED' },
            });
        }

        // Revalidate pages to show the new order immediately
        revalidatePath('/dashboard/orders');
        revalidatePath('/dashboard/kitchen');
        revalidatePath('/dashboard/tables');
        revalidatePath('/dashboard/zones');

        return { success: true, orderId: order.id };
    } catch (error) {
        console.error('Error creating order:', error);
        return { success: false, error: 'Error al crear el pedido' };
    }
}

export async function getOrderDetails(id: string) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return null;
    }

    const rawOrder = await prisma.order.findUnique({
        where: {
            id,
            restaurantId: session.user.restaurantId,
        },
        include: {
            table: true,
            user: true,
            items: {
                include: {
                    product: true,
                    modifiers: {
                        include: {
                            modifier: true,
                        },
                    },
                },
            },
        },
    });

    if (!rawOrder) return null;

    // Transform Decimal fields to numbers for client component serialization
    const order = {
        ...rawOrder,
        subtotal: Number(rawOrder.subtotal),
        tax: Number(rawOrder.tax),
        discount: Number(rawOrder.discount || 0),
        tip: Number(rawOrder.tip || 0),
        total: Number(rawOrder.total),
        items: rawOrder.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            product: {
                ...item.product,
                price: Number(item.product.price),
                cost: Number(item.product.cost || 0),
            },
            modifiers: item.modifiers.map(mod => ({
                ...mod,
                price: Number(mod.price),
                modifier: {
                    ...mod.modifier,
                    price: Number(mod.modifier.price),
                }
            }))
        }))
    };

    return order;
}

export async function updateOrderStatus(id: string, status: string) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        // Get the order to check if it has a table
        const order = await prisma.order.findUnique({
            where: {
                id,
                restaurantId: session.user.restaurantId,
            },
            select: {
                tableId: true,
            },
        });

        if (!order) {
            return { success: false, error: 'Pedido no encontrado' };
        }

        await prisma.order.update({
            where: {
                id,
                restaurantId: session.user.restaurantId,
            },
            data: {
                status,
                ...(status === 'CONFIRMED' && { confirmedAt: new Date() }),
                ...(status === 'PREPARING' && { preparingAt: new Date() }),
                ...(status === 'READY' && { readyAt: new Date() }),
                ...(status === 'SERVED' && { servedAt: new Date() }),
                ...(status === 'COMPLETED' && { completedAt: new Date() }),
                ...(status === 'CANCELLED' && { cancelledAt: new Date() }),
            },
        });

        // Free the table if order is completed or cancelled
        if (order.tableId && (status === 'COMPLETED' || status === 'CANCELLED')) {
            await prisma.table.update({
                where: { id: order.tableId },
                data: { status: 'AVAILABLE' },
            });
        }

        revalidatePath('/dashboard/kitchen');
        revalidatePath('/dashboard/orders');
        revalidatePath(`/dashboard/orders/${id}`);
        revalidatePath('/dashboard/tables');
        revalidatePath('/dashboard/zones');

        return { success: true };
    } catch (error) {
        console.error('Error updating order status:', error);
        return { success: false, error: 'Error al actualizar el estado' };
    }
}

export async function getKitchenOrders() {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return [];
    }

    const rawOrders = await prisma.order.findMany({
        where: {
            restaurantId: session.user.restaurantId,
            status: {
                in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'],
            },
        },
        orderBy: {
            createdAt: 'asc',
        },
        include: {
            table: true,
            items: {
                include: {
                    product: true,
                    modifiers: {
                        include: {
                            modifier: true,
                        },
                    },
                },
            },
        },
    });

    // Transform Decimal fields to numbers for client component serialization
    const orders = rawOrders.map(order => ({
        ...order,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        discount: Number(order.discount || 0),
        tip: Number(order.tip || 0),
        total: Number(order.total),
        items: order.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            product: {
                ...item.product,
                price: Number(item.product.price),
                cost: Number(item.product.cost || 0),
            },
            modifiers: item.modifiers.map(mod => ({
                ...mod,
                price: Number(mod.price),
                modifier: {
                    ...mod.modifier,
                    price: Number(mod.modifier.price),
                }
            }))
        }))
    }));

    return orders;
}

export async function getOrderHistory({
    page = 1,
    limit = 10,
    search,
    startDate,
    endDate,
}: {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return {
            data: [],
            meta: {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            },
        };
    }

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
        restaurantId: session.user.restaurantId,
        status: {
            in: ['COMPLETED', 'CANCELLED'],
        },
        ...(search && {
            OR: [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
            ],
        }),
        ...(startDate && endDate && {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        }),
    };

    const [data, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                table: true,
                user: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        }),
        prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
        },
    };
}
