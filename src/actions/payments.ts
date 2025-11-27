'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';

/**
 * Genera un código de pago único para una orden
 */
export async function generatePaymentCode(orderId: string) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        // Verificar que la orden existe y pertenece al restaurante
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                restaurantId: session.user.restaurantId,
            },
        });

        if (!order) {
            return { success: false, error: 'Orden no encontrada' };
        }

        // Si ya tiene código de pago, devolverlo
        if (order.paymentCode) {
            return { success: true, paymentCode: order.paymentCode };
        }

        // Generar nuevo código de pago
        const count = await prisma.order.count({
            where: { restaurantId: session.user.restaurantId },
        });
        const paymentCode = `PAY-${(count + 1).toString().padStart(4, '0')}`;

        // Actualizar la orden con el código de pago
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentCode },
        });

        revalidatePath('/dashboard/orders');
        revalidatePath(`/dashboard/orders/${orderId}`);

        return { success: true, paymentCode };
    } catch (error) {
        console.error('Error generating payment code:', error);
        return { success: false, error: 'Error al generar código de pago' };
    }
}

/**
 * Busca una orden por su código de pago
 */
export async function getOrderByPaymentCode(paymentCode: string) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return null;
    }

    try {
        const rawOrder = await prisma.order.findFirst({
            where: {
                paymentCode: paymentCode.toUpperCase(),
                restaurantId: session.user.restaurantId,
            },
            include: {
                table: {
                    include: {
                        zone: true,
                    },
                },
                items: {
                    include: {
                        product: true,
                    },
                },
                payments: {
                    include: {
                        cashier: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!rawOrder) return null;

        // Calcular monto pagado
        const amountPaid = rawOrder.payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
        );

        // Transform Decimal fields to numbers
        const order = {
            ...rawOrder,
            subtotal: Number(rawOrder.subtotal),
            tax: Number(rawOrder.tax),
            discount: Number(rawOrder.discount || 0),
            tip: Number(rawOrder.tip || 0),
            total: Number(rawOrder.total),
            amountPaid,
            amountDue: Number(rawOrder.total) - amountPaid,
            items: rawOrder.items.map((item) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                subtotal: Number(item.subtotal),
                product: {
                    ...item.product,
                    price: Number(item.product.price),
                    cost: Number(item.product.cost || 0),
                },
            })),
            payments: rawOrder.payments.map((payment) => ({
                ...payment,
                amount: Number(payment.amount),
            })),
        };

        return order;
    } catch (error) {
        console.error('Error fetching order by payment code:', error);
        return null;
    }
}

/**
 * Registra un nuevo pago para una orden
 */
export async function registerPayment(data: {
    orderId: string;
    method: string;
    amount: number;
    reference?: string;
    receiptType?: string;
    receiptNumber?: string;
    customerDoc?: string;
    customerName?: string;
    customerAddress?: string;
    notes?: string;
}) {
    const session = await auth();

    if (!session?.user?.restaurantId || !session?.user?.id) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await requirePermission(PERMISSIONS.PAYMENTS_CREATE);

        // Verificar que la orden existe y pertenece al restaurante
        const order = await prisma.order.findFirst({
            where: {
                id: data.orderId,
                restaurantId: session.user.restaurantId,
            },
            include: {
                payments: true,
            },
        });

        if (!order) {
            return { success: false, error: 'Orden no encontrada' };
        }

        // Calcular monto total pagado hasta ahora
        const totalPaid = order.payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
        );

        const orderTotal = Number(order.total);
        const newTotalPaid = totalPaid + data.amount;

        // Validar que el pago no exceda el total
        if (newTotalPaid > orderTotal) {
            return {
                success: false,
                error: `El monto excede el total de la orden. Monto pendiente: S/ ${(orderTotal - totalPaid).toFixed(2)}`,
            };
        }

        // Determinar el nuevo estado de pago
        let paymentStatus = 'PENDING';
        if (newTotalPaid >= orderTotal) {
            paymentStatus = 'PAID';
        } else if (newTotalPaid > 0) {
            paymentStatus = 'PARTIAL';
        }

        // Registrar el pago
        const payment = await prisma.payment.create({
            data: {
                orderId: data.orderId,
                cashierId: session.user.id,
                method: data.method,
                amount: data.amount,
                reference: data.reference,
                status: 'COMPLETED',
                receiptType: data.receiptType,
                receiptNumber: data.receiptNumber,
                customerDoc: data.customerDoc,
                customerName: data.customerName,
                customerAddress: data.customerAddress,
                notes: data.notes,
            },
        });

        // Buscar caja abierta del usuario actual para asignar la venta
        const openShift = await prisma.cashRegister.findFirst({
            where: {
                userId: session.user.id,
                closedAt: null
            }
        });

        // Actualizar el estado de pago de la orden y asignar caja si existe
        await prisma.order.update({
            where: { id: data.orderId },
            data: {
                paymentStatus,
                // Asignar a la caja actual si existe
                ...(openShift ? { cashRegisterId: openShift.id } : {}),
                // Si el pago está completo y la orden está servida, marcarla como completada
                ...(paymentStatus === 'PAID' && order.status === 'SERVED'
                    ? { status: 'COMPLETED', completedAt: new Date() }
                    : {}),
            },
        });

        revalidatePath('/dashboard/orders');
        revalidatePath('/dashboard/payments');
        revalidatePath(`/dashboard/orders/${data.orderId}`);
        revalidatePath('/dashboard/cash-register');

        return {
            success: true,
            paymentId: payment.id,
            paymentStatus,
            amountDue: orderTotal - newTotalPaid,
        };
    } catch (error) {
        console.error('Error registering payment:', error);
        return { success: false, error: 'Error al registrar el pago' };
    }
}

/**
 * Obtiene los pagos de una orden específica
 */
export async function getOrderPayments(orderId: string) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return [];
    }

    try {
        const rawPayments = await prisma.payment.findMany({
            where: {
                orderId,
                order: {
                    restaurantId: session.user.restaurantId,
                },
            },
            include: {
                cashier: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const payments = rawPayments.map((payment) => ({
            ...payment,
            amount: Number(payment.amount),
        }));

        return payments;
    } catch (error) {
        console.error('Error fetching order payments:', error);
        return [];
    }
}

/**
 * Obtiene el historial general de pagos con filtros
 */
export async function getPaymentHistory({
    page = 1,
    limit = 20,
    search,
    method,
    startDate,
    endDate,
}: {
    page?: number;
    limit?: number;
    search?: string;
    method?: string;
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
                limit: 20,
                totalPages: 0,
            },
        };
    }

    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
        order: {
            restaurantId: session.user.restaurantId,
        },
        ...(search && {
            OR: [
                { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
                { order: { paymentCode: { contains: search, mode: 'insensitive' } } },
                { reference: { contains: search, mode: 'insensitive' } },
            ],
        }),
        ...(method && { method }),
        ...(startDate &&
            endDate && {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        }),
    };

    try {
        const [rawData, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            paymentCode: true,
                            table: {
                                select: {
                                    number: true,
                                },
                            },
                        },
                    },
                    cashier: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.payment.count({ where }),
        ]);

        const data = rawData.map((payment) => ({
            ...payment,
            amount: Number(payment.amount),
        }));

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
    } catch (error) {
        console.error('Error fetching payment history:', error);
        return {
            data: [],
            meta: {
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0,
            },
        };
    }
}
