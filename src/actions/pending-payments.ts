'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export interface PendingPaymentOrder {
  id: string;
  orderNumber: string;
  paymentCode: string | null;
  total: number;
  createdAt: Date;
  table: {
    number: string;
    zone?: { name: string } | null;
  } | null;
  customerName: string | null;
}

/**
 * Get all orders pending payment (SERVED status)
 */
export async function getPendingPayments(): Promise<{
  success: boolean;
  data?: PendingPaymentOrder[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return { success: false, error: 'No autorizado' };
    }

    const rawOrders = await prisma.order.findMany({
      where: {
        restaurantId: session.user.restaurantId,
        status: 'SERVED',
        paymentStatus: { not: 'PAID' },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        orderNumber: true,
        paymentCode: true,
        total: true,
        createdAt: true,
        customerName: true,
        table: {
          select: {
            number: true,
            zone: {
              select: { name: true },
            },
          },
        },
      },
    });

    const orders: PendingPaymentOrder[] = rawOrders.map((order) => ({
      ...order,
      total: Number(order.total),
    }));

    return { success: true, data: orders };
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return { success: false, error: 'Error al obtener pagos pendientes' };
  }
}

/**
 * Get count of pending payments for badge
 */
export async function getPendingPaymentsCount(): Promise<number> {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return 0;
    }

    const count = await prisma.order.count({
      where: {
        restaurantId: session.user.restaurantId,
        status: 'SERVED',
        paymentStatus: { not: 'PAID' },
      },
    });

    return count;
  } catch (error) {
    console.error('Error counting pending payments:', error);
    return 0;
  }
}
