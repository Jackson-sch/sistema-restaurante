"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Get full order details with items, modifiers, and payments
 */
export async function getOrderDetails(orderId: string) {
    try {
        const session = await auth()
        if (!session?.user?.restaurantId) {
            return { success: false, error: "No autorizado" }
        }

        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
                restaurantId: session.user.restaurantId
            },
            include: {
                table: {
                    include: {
                        zone: true
                    }
                },
                items: {
                    include: {
                        product: {
                            include: {
                                category: true
                            }
                        },
                        modifiers: {
                            include: {
                                modifier: true
                            }
                        }
                    }
                },
                payments: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        if (!order) {
            return { success: false, error: "Orden no encontrada" }
        }

        // Serialize Decimal fields
        const serializedOrder = {
            ...order,
            subtotal: Number(order.subtotal),
            discount: order.discount ? Number(order.discount) : 0,
            tax: order.tax ? Number(order.tax) : 0,
            tip: order.tip ? Number(order.tip) : 0,
            total: Number(order.total),
            items: order.items.map((item: any) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                subtotal: Number(item.subtotal),
                product: {
                    ...item.product,
                    price: Number(item.product.price),
                    cost: item.product.cost ? Number(item.product.cost) : null,
                },
                modifiers: item.modifiers.map((mod: any) => ({
                    ...mod,
                    price: Number(mod.price),
                    modifier: {
                        ...mod.modifier,
                        price: Number(mod.modifier.price),
                    }
                }))
            })),
            payments: order.payments.map((payment: any) => ({
                ...payment,
                amount: Number(payment.amount)
            }))
        }

        return { success: true, data: serializedOrder }
    } catch (error) {
        console.error("Error getting order details:", error)
        return { success: false, error: "Error al obtener detalles de la orden" }
    }
}

/**
 * Get all active orders for a table
 */
export async function getTableOrders(tableId: string) {
    try {
        const session = await auth()
        if (!session?.user?.restaurantId) {
            return { success: false, error: "No autorizado" }
        }

        const orders = await prisma.order.findMany({
            where: {
                tableId,
                restaurantId: session.user.restaurantId,
                status: {
                    in: ["PENDING", "IN_PROGRESS", "READY", "SERVED"]
                }
            },
            include: {
                items: {
                    include: {
                        product: true,
                        modifiers: {
                            include: {
                                modifier: true
                            }
                        }
                    }
                },
                payments: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Serialize Decimal fields
        const serializedOrders = orders.map(order => ({
            ...order,
            subtotal: Number(order.subtotal),
            discount: order.discount ? Number(order.discount) : 0,
            tax: order.tax ? Number(order.tax) : 0,
            tip: order.tip ? Number(order.tip) : 0,
            total: Number(order.total),
            items: order.items.map((item: any) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                subtotal: Number(item.subtotal),
                product: {
                    ...item.product,
                    price: Number(item.product.price),
                    cost: item.product.cost ? Number(item.product.cost) : null,
                },
                modifiers: item.modifiers.map((mod: any) => ({
                    ...mod,
                    price: Number(mod.price),
                    modifier: {
                        ...mod.modifier,
                        price: Number(mod.modifier.price),
                    }
                }))
            })),
            payments: order.payments.map((payment: any) => ({
                ...payment,
                amount: Number(payment.amount)
            }))
        }))

        return { success: true, data: serializedOrders }
    } catch (error) {
        console.error("Error getting table orders:", error)
        return { success: false, error: "Error al obtener órdenes de la mesa" }
    }
}

/**
 * Process quick payment for an order
 */
export async function processQuickPayment(
    orderId: string,
    paymentData: {
        method: string
        amount: number
        receiptType?: string
        customerDoc?: string
        customerName?: string
        customerAddress?: string
        reference?: string
        notes?: string
    }
) {
    try {
        const session = await auth()
        if (!session?.user?.id || !session?.user?.restaurantId) {
            return { success: false, error: "No autorizado" }
        }

        // Check if cash register is open
        const cashRegisterStatus = await prisma.cashRegister.findFirst({
            where: {
                userId: session.user.id,
                closedAt: null
            }
        })

        if (!cashRegisterStatus) {
            return {
                success: false,
                error: "Debes abrir la caja antes de procesar pagos"
            }
        }

        // Get order with complete data for receipt
        const orderWithDetails = await prisma.order.findUnique({
            where: {
                id: orderId,
                restaurantId: session.user.restaurantId
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                table: {
                    include: {
                        zone: true
                    }
                },
                restaurant: {
                    select: {
                        name: true,
                        ruc: true,
                        address: true,
                        phone: true,
                        logo: true
                    }
                }
            }
        })

        if (!orderWithDetails) {
            return { success: false, error: "Orden no encontrada" }
        }

        // Get and update receipt series if receipt type is provided
        let receiptNumber: string | undefined
        if (paymentData.receiptType) {
            const series = await prisma.receiptSeries.findFirst({
                where: {
                    restaurantId: session.user.restaurantId,
                    type: paymentData.receiptType,
                    active: true
                }
            })

            if (!series) {
                return {
                    success: false,
                    error: `No se encontró una serie activa para ${paymentData.receiptType}`
                }
            }

            // Generate receipt number
            const nextNumber = series.currentNumber + 1
            receiptNumber = `${series.series}-${String(nextNumber).padStart(8, '0')}`

            // Update series counter
            await prisma.receiptSeries.update({
                where: { id: series.id },
                data: { currentNumber: nextNumber }
            })
        }

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                orderId,
                cashierId: session.user.id,
                method: paymentData.method,
                amount: paymentData.amount,
                receiptType: paymentData.receiptType,
                receiptNumber,
                customerDoc: paymentData.customerDoc,
                customerName: paymentData.customerName,
                customerAddress: paymentData.customerAddress,
                reference: paymentData.reference,
                notes: paymentData.notes,
                status: "COMPLETED"
            }
        })

        // Update order status to COMPLETED and link to cash register
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                cashRegisterId: cashRegisterStatus.id
            }
        })

        // Update table status to AVAILABLE if no more active orders
        if (orderWithDetails.tableId) {
            const activeOrders = await prisma.order.count({
                where: {
                    tableId: orderWithDetails.tableId,
                    status: {
                        in: ["PENDING", "IN_PROGRESS", "READY", "SERVED"]
                    }
                }
            })

            if (activeOrders === 0) {
                await prisma.table.update({
                    where: { id: orderWithDetails.tableId },
                    data: { status: "AVAILABLE" }
                })
            }
        }


        revalidatePath("/dashboard/tables")
        revalidatePath("/dashboard/orders")

        return {
            success: true,
            data: {
                payment: {
                    id: payment.id,
                    amount: Number(payment.amount)
                }
            }
        }
    } catch (error) {
        console.error("Error processing payment:", error)
        return { success: false, error: "Error al procesar el pago" }
    }
}

/**
 * Get active receipt series for a restaurant
 */
export async function getReceiptSeries(receiptType: string) {
    try {
        const session = await auth()
        if (!session?.user?.restaurantId) {
            return { success: false, error: "No autorizado" }
        }

        const series = await prisma.receiptSeries.findFirst({
            where: {
                restaurantId: session.user.restaurantId,
                type: receiptType,
                active: true
            }
        })

        if (!series) {
            return { success: false, error: "Serie no encontrada" }
        }

        const nextNumber = series.currentNumber + 1
        const previewNumber = `${series.series}-${String(nextNumber).padStart(8, '0')}`

        return {
            success: true,
            data: {
                series: series.series,
                currentNumber: series.currentNumber,
                nextNumber,
                previewNumber
            }
        }
    } catch (error) {
        console.error("Error getting receipt series:", error)
        return { success: false, error: "Error al obtener serie" }
    }
}
