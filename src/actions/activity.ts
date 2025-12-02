"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export type ActivityType =
  | 'order_created'
  | 'order_completed'
  | 'payment_received'
  | 'table_freed'
  | 'table_occupied'
  | 'stock_adjusted'

export interface Activity {
  id: string
  type: ActivityType
  description: string
  timestamp: Date
  metadata?: {
    orderId?: string
    tableNumber?: string
    amount?: number
    ingredientName?: string
  }
}

export async function getRecentActivities(limit: number = 15) {
  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No autorizado" }
  }

  try {
    const activities: Activity[] = []

    // Get recent orders (last 2 hours)
    const recentOrders = await prisma.order.findMany({
      where: {
        restaurantId: session.user.restaurantId,
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        completedAt: true,
        status: true,
        total: true,
        table: {
          select: {
            number: true,
          },
        },
      },
    })

    // Add order created activities
    recentOrders.forEach(order => {
      activities.push({
        id: `order-created-${order.id}`,
        type: 'order_created',
        description: order.table
          ? `Nueva orden #${order.orderNumber} en Mesa ${order.table.number}`
          : `Nueva orden #${order.orderNumber} para llevar`,
        timestamp: order.createdAt,
        metadata: {
          orderId: order.id,
          tableNumber: order.table?.number ?? undefined,
          amount: Number(order.total),
        },
      })

      // Add order completed activities
      if (order.completedAt && order.status === 'COMPLETED') {
        activities.push({
          id: `order-completed-${order.id}`,
          type: 'order_completed',
          description: `Orden #${order.orderNumber} completada - S/ ${Number(order.total).toFixed(2)}`,
          timestamp: order.completedAt,
          metadata: {
            orderId: order.id,
            amount: Number(order.total),
          },
        })
      }
    })

    // Get recent payments (last 2 hours)
    const recentPayments = await prisma.payment.findMany({
      where: {
        order: {
          restaurantId: session.user.restaurantId,
        },
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        amount: true,
        method: true,
        createdAt: true,
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    })

    // Add payment activities
    recentPayments.forEach(payment => {
      const methodLabels: Record<string, string> = {
        CASH: 'Efectivo',
        CARD: 'Tarjeta',
        TRANSFER: 'Transferencia',
        YAPE: 'Yape',
        PLIN: 'Plin',
      }

      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment_received',
        description: `Pago recibido S/ ${Number(payment.amount).toFixed(2)} (${methodLabels[payment.method] || payment.method}) - Orden #${payment.order.orderNumber}`,
        timestamp: payment.createdAt,
        metadata: {
          amount: Number(payment.amount),
        },
      })
    })

    // Get recent table status changes (tables that were recently freed)
    const recentlyFreedTables = await prisma.table.findMany({
      where: {
        restaurantId: session.user.restaurantId,
        status: 'AVAILABLE',
        updatedAt: {
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        number: true,
        updatedAt: true,
      },
    })

    recentlyFreedTables.forEach(table => {
      activities.push({
        id: `table-freed-${table.id}`,
        type: 'table_freed',
        description: `Mesa ${table.number} liberada`,
        timestamp: table.updatedAt,
        metadata: {
          tableNumber: table.number ?? undefined,
        },
      })
    })

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Return limited number of activities
    return {
      success: true,
      data: activities.slice(0, limit),
    }
  } catch (error) {
    console.error("Error fetching activities:", error)
    return { success: false, error: "Error al obtener actividades" }
  }
}
