"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, differenceInMinutes, format, eachDayOfInterval } from "date-fns"

interface DateRange {
  from: Date
  to: Date
}

export async function getDashboardStats(dateRange?: DateRange) {
  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No autorizado" }
  }

  try {
    const today = new Date()
    const from = dateRange?.from || startOfDay(today)
    const to = dateRange?.to || endOfDay(today)

    // Calculate previous period for comparison
    const periodDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const previousFromTime = from.getTime() - (periodDays * 24 * 60 * 60 * 1000)
    const previousToTime = to.getTime() - (periodDays * 24 * 60 * 60 * 1000)
    const previousFrom = new Date(previousFromTime)
    const previousTo = new Date(previousToTime)

    // Current period orders
    const currentOrders = await prisma.order.findMany({
      where: {
        restaurantId: session.user.restaurantId,
        createdAt: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
      select: {
        total: true,
        status: true,
        createdAt: true,
        completedAt: true,
        items: {
          select: {
            product: {
              select: {
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            unitPrice: true,
            subtotal: true,
            quantity: true,
          },
        },
      },
    })


    // Previous period orders for comparison
    const previousOrders = await prisma.order.findMany({
      where: {
        restaurantId: session.user.restaurantId,
        createdAt: { gte: previousFrom, lte: previousTo },
        status: { not: "CANCELLED" },
      },
      select: {
        total: true,
      },
    })

    // Calculate metrics
    const currentSales = currentOrders.reduce((sum, order) => sum + Number(order.total), 0)
    const previousSales = previousOrders.reduce((sum, order) => sum + Number(order.total), 0)
    const salesChange = previousSales > 0 ? ((currentSales - previousSales) / previousSales) * 100 : 0

    const completedOrders = currentOrders.filter(o => o.status === "COMPLETED")
    const completedCount = completedOrders.length
    const previousCompletedCount = previousOrders.length
    const ordersChange = previousCompletedCount > 0
      ? ((completedCount - previousCompletedCount) / previousCompletedCount) * 100
      : 0

    // Ticket Promedio
    const averageTicket = completedCount > 0 ? currentSales / completedCount : 0
    const previousAverageTicket = previousCompletedCount > 0
      ? previousSales / previousCompletedCount
      : 0
    const ticketChange = previousAverageTicket > 0
      ? ((averageTicket - previousAverageTicket) / previousAverageTicket) * 100
      : 0

    // Tiempo Promedio de Atención
    const completedWithTime = completedOrders.filter(o => o.completedAt)
    const averageTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, o) => {
        return sum + differenceInMinutes(o.completedAt!, o.createdAt)
      }, 0) / completedWithTime.length
      : 0

    // Órdenes activas, mesas, y stock bajo - fetch in parallel (always current, not filtered by date)
    const [activeOrders, occupiedTables, totalTables, lowStockIngredients] = await Promise.all([
      prisma.order.count({
        where: {
          restaurantId: session.user.restaurantId,
          status: {
            in: ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED"],
          },
        },
      }),
      prisma.table.count({
        where: {
          restaurantId: session.user.restaurantId,
          status: "OCCUPIED",
        },
      }),
      prisma.table.count({
        where: {
          restaurantId: session.user.restaurantId,
        },
      }),
      prisma.ingredient.findMany({
        where: {
          restaurantId: session.user.restaurantId,
        },
        select: {
          id: true,
          name: true,
          currentStock: true,
          minStock: true,
          unit: true,
        },
      }),
    ])

    const lowStock = lowStockIngredients.filter(
      ing => Number(ing.currentStock) <= Number(ing.minStock)
    )

    // Sales by day
    const days = eachDayOfInterval({ start: from, end: to })

    // Group current orders by day using local date string
    const salesByDayMap = new Map<string, number>()

    // Initialize all days with 0
    days.forEach(day => {
      salesByDayMap.set(format(day, 'yyyy-MM-dd'), 0)
    })

    // Aggregate sales from currentOrders
    currentOrders.forEach(order => {
      const dateKey = format(order.createdAt, 'yyyy-MM-dd')
      if (salesByDayMap.has(dateKey)) {
        salesByDayMap.set(dateKey, (salesByDayMap.get(dateKey) || 0) + Number(order.total))
      }
    })

    // Convert to array
    const salesByDay = Array.from(salesByDayMap.entries()).map(([date, total]) => ({
      date,
      total
    }))

    // Sales by category
    const salesByCategory: Record<string, number> = {}
    currentOrders.forEach(order => {
      order.items.forEach((item: any) => {
        const category = item.product.category?.name || 'Sin categoría'
        const itemTotal = Number(item.subtotal)
        salesByCategory[category] = (salesByCategory[category] || 0) + itemTotal
      })
    })

    const categoryData = Object.entries(salesByCategory).map(([name, value]) => ({
      name,
      value,
    }))

    // Top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          restaurantId: session.user.restaurantId,
          createdAt: { gte: from, lte: to },
          status: { not: "CANCELLED" },
        },
      },
      _sum: {
        quantity: true,
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    })

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, price: true },
        })
        return {
          name: product?.name || 'Producto desconocido',
          quantity: item._sum.quantity || 0,
          orders: item._count.productId,
          revenue: Number(product?.price || 0) * (item._sum.quantity || 0),
        }
      })
    )

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      where: {
        restaurantId: session.user.restaurantId,
        createdAt: { gte: from, lte: to },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        type: true,
        createdAt: true,
        table: {
          select: {
            number: true,
          },
        },
      },
    })

    // Generate alerts
    const alerts: Array<{
      id: string
      type: "critical" | "warning" | "info"
      title: string
      message: string
      action?: { label: string; href: string }
    }> = []

    // Critical: Stock at zero
    const criticalStock = lowStock.filter(ing => Number(ing.currentStock) === 0)
    if (criticalStock.length > 0) {
      alerts.push({
        id: "critical-stock",
        type: "critical",
        title: "Stock Agotado",
        message: `${criticalStock.length} ingrediente(s) sin stock: ${criticalStock.map(i => i.name).join(", ")}`,
        action: { label: "Ver inventario", href: "/dashboard/inventory" },
      })
    }

    // Warning: Low stock
    const warningStock = lowStock.filter(ing => Number(ing.currentStock) > 0)
    if (warningStock.length > 0) {
      alerts.push({
        id: "low-stock",
        type: "warning",
        title: "Stock Bajo",
        message: `${warningStock.length} ingrediente(s) por debajo del mínimo: ${warningStock.map(i => i.name).join(", ")}`,
        action: { label: "Ver inventario", href: "/dashboard/inventory" },
      })
    }

    return {
      success: true,
      data: {
        // Main metrics with comparisons
        sales: {
          current: currentSales,
          change: salesChange,
        },
        orders: {
          current: completedCount,
          change: ordersChange,
        },
        averageTicket: {
          current: averageTicket,
          change: ticketChange,
        },
        averageTime: Math.round(averageTime),

        // Current status (not time-filtered)
        activeOrders,
        occupiedTables,
        totalTables,
        lowStockCount: lowStock.length,
        lowStockItems: lowStock.map(ing => ({
          id: ing.id,
          name: ing.name,
          currentStock: Number(ing.currentStock),
          minStock: Number(ing.minStock),
          unit: ing.unit,
        })),

        // Charts data
        salesByDay,
        salesByCategory: categoryData,
        topProducts: topProductsWithDetails,
        recentOrders: recentOrders.map(order => ({
          ...order,
          total: Number(order.total),
        })),

        // Alerts
        alerts,
      },
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return { success: false, error: "Error al obtener estadísticas" }
  }
}
