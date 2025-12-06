"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startOfWeek, endOfWeek } from "date-fns"

export async function getOrderTypeStats(dateRange?: { from: Date; to: Date }) {
  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No autorizado" }
  }

  const restaurantId = session.user.restaurantId
  const now = new Date()
  const from = dateRange?.from || startOfWeek(now, { weekStartsOn: 1 })
  const to = dateRange?.to || endOfWeek(now, { weekStartsOn: 1 })

  try {
    const ordersByType = await prisma.order.groupBy({
      by: ['type'],
      where: {
        restaurantId,
        createdAt: { gte: from, lte: to },
        status: 'COMPLETED'
      },
      _count: { id: true },
      _sum: { total: true }
    })

    const topProductsByType = await Promise.all(
      ['DINE_IN', 'TAKEOUT', 'DELIVERY'].map(async (type) => {
        const items = await prisma.orderItem.findMany({
          where: {
            order: {
              restaurantId,
              type: type as any,
              createdAt: { gte: from, lte: to },
              status: 'COMPLETED'
            }
          },
          include: { product: { select: { id: true, name: true } } }
        })

        const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
        items.forEach(item => {
          const current = productMap.get(item.product.id) || { name: item.product.name, quantity: 0, revenue: 0 }
          current.quantity += item.quantity
          current.revenue += Number(item.subtotal)
          productMap.set(item.product.id, current)
        })

        return {
          type,
          products: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
        }
      })
    )

    const totalSales = ordersByType.reduce((acc, curr) => acc + Number(curr._sum.total || 0), 0)
    const byType = ordersByType.map(stat => {
      const typeProducts = topProductsByType.find(t => t.type === stat.type)
      const sales = Number(stat._sum.total || 0)
      return {
        type: stat.type,
        totalSales: sales,
        orderCount: stat._count.id,
        averageTicket: stat._count.id > 0 ? sales / stat._count.id : 0,
        percentage: totalSales > 0 ? (sales / totalSales) * 100 : 0,
        topProducts: typeProducts?.products || []
      }
    })

    return {
      success: true,
      data: { byType, totalSales, totalOrders: ordersByType.reduce((acc, curr) => acc + curr._count.id, 0) }
    }
  } catch (error) {
    console.error("Error fetching order type stats:", error)
    return { success: false, error: "Error al obtener estadísticas por tipo de orden" }
  }
}
