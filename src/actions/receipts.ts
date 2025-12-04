'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { ReceiptData, ReceiptType } from '@/types/receipt';

/**
 * Obtiene los datos completos para generar un comprobante
 */
export async function getReceiptData(paymentId: string): Promise<ReceiptData | null> {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return null;
    }

    try {
        const payment = await prisma.payment.findFirst({
            where: {
                id: paymentId,
                order: {
                    restaurantId: session.user.restaurantId,
                },
            },
            include: {
                order: {
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
                        restaurant: true,
                    },
                },
                cashier: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!payment || !payment.order) {
            return null;
        }

        const order = payment.order;
        const restaurant = order.restaurant;

        // Determine receipt type
        let receiptType = ReceiptType.NOTA_VENTA;
        if (payment.receiptType) {
            receiptType = payment.receiptType as ReceiptType;
        }

        // Calculate change if cash payment
        const received = payment.method === 'CASH' ? Number(payment.amount) : undefined;
        const change = received ? Math.max(0, received - Number(order.total)) : undefined;

        const receiptData: ReceiptData = {
            type: receiptType,
            number: payment.receiptNumber || '',
            date: payment.createdAt,

            restaurant: {
                name: restaurant.name,
                ruc: restaurant.ruc || '',
                address: restaurant.address || '',
                phone: restaurant.phone || '',
                logo: restaurant.logo,
            },

            order: {
                orderNumber: order.orderNumber,
                table: order.table
                    ? `${order.table.number}${order.table.zone ? ` - ${order.table.zone.name}` : ''}`
                    : undefined,
                items: order.items.map((item) => ({
                    quantity: item.quantity,
                    name: item.product.name,
                    unitPrice: Number(item.unitPrice),
                    total: Number(item.subtotal),
                })),
            },

            subtotal: Number(order.subtotal),
            tax: Number(order.tax),
            discount: Number(order.discount || 0),
            total: Number(order.total),

            payment: {
                method: payment.method,
                amount: Number(payment.amount),
                received,
                change,
                reference: payment.reference || undefined,
            },

            customer: payment.customerName
                ? {
                    name: payment.customerName,
                    doc: payment.customerDoc || '',
                    address: payment.customerAddress || undefined,
                }
                : undefined,

            cashier: {
                name: payment.cashier?.name || 'N/A',
            },
        };

        return receiptData;
    } catch (error) {
        console.error('Error fetching receipt data:', error);
        return null;
    }
}
