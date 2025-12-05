"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startOfWeek, endOfWeek, subWeeks, format, getHours, getDay } from "date-fns"
import { es } from "date-fns/locale"

export async function getAnalyticsData(dateRange?: { from: Date; to: Date }) {
  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No autorizado" }
  }

  const restaurantId = session.user.restaurantId

  // Default to current week if no range provided
  const now = new Date()
  const from = dateRange?.from || startOfWeek(now, { weekStartsOn: 1 })
  const to = dateRange?.to || endOfWeek(now, { weekStartsOn: 1 })

  try {
    const [weeklyComparison, peakHours, categoryPerformance, waiterPerformance] = await Promise.all([
      getWeeklyComparison(restaurantId),
      getPeakHours(restaurantId, from, to),
      getCategoryPerformance(restaurantId, from, to),
      getWaiterPerformance(restaurantId, from, to)
    ])

    return {
      success: true,
      data: {
        weeklyComparison,
        peakHours,
        categoryPerformance,
        waiterPerformance
      }
    }
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return { success: false, error: "Error al obtener datos analíticos" }
  }
}

async function getWeeklyComparison(restaurantId: string) {
  const now = new Date()
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const previousWeekStart = subWeeks(currentWeekStart, 1)
  const previousWeekEnd = endOfWeek(previousWeekStart, { weekStartsOn: 1 })

  // Current week sales
  const currentWeekSales = await prisma.order.groupBy({
    by: ['createdAt'],
    where: {
      restaurantId,
      createdAt: {
        gte: currentWeekStart,
        lte: now
      },
      status: 'COMPLETED'
    },
    _sum: {
      total: true
    }
  })

  // Previous week sales
  const previousWeekSales = await prisma.order.groupBy({
    by: ['createdAt'],
    where: {
      restaurantId,
      createdAt: {
        gte: previousWeekStart,
        lte: previousWeekEnd
      },
      status: 'COMPLETED'
    },
    _sum: {
      total: true
    }
  })

  // Process data for chart
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  return days.map((day, index) => {
    // Filter sales for this day index (0 = Monday in our array, but getDay() returns 0 for Sunday)
    // We need to map getDay() 0-6 (Sun-Sat) to our 0-6 (Mon-Sun)

    const currentTotal = currentWeekSales.reduce((acc, curr) => {
      const dateDay = getDay(curr.createdAt)
      const adjustedDay = dateDay === 0 ? 6 : dateDay - 1
      if (adjustedDay === index) {
        return acc + Number(curr._sum.total || 0)
      }
      return acc
    }, 0)

    const previousTotal = previousWeekSales.reduce((acc, curr) => {
      const dateDay = getDay(curr.createdAt)
      const adjustedDay = dateDay === 0 ? 6 : dateDay - 1
      if (adjustedDay === index) {
        return acc + Number(curr._sum.total || 0)
      }
      return acc
    }, 0)

    return {
      day,
      current: currentTotal,
      previous: previousTotal
    }
  })
}

async function getPeakHours(restaurantId: string, from: Date, to: Date) {
  // Get all orders in range
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: {
        gte: from,
        lte: to
      }
    },
    select: {
      createdAt: true
    }
  })

  // Initialize 7x24 grid
  const heatmap = Array(7).fill(0).map(() => Array(24).fill(0))

  orders.forEach(order => {
    const day = getDay(order.createdAt) // 0 = Sunday
    const hour = getHours(order.createdAt)

    // Adjust day to 0=Monday, 6=Sunday for visualization usually
    // But let's keep 0=Sunday for standard compatibility if needed, 
    // or adjust. Let's use 0=Monday to match our other charts.
    const adjustedDay = day === 0 ? 6 : day - 1

    heatmap[adjustedDay][hour]++
  })

  return heatmap
}

async function getCategoryPerformance(restaurantId: string, from: Date, to: Date) {
  // We need to join OrderItem -> Product -> Category
  // Prisma doesn't support deep groupBy easily, so we fetch items and aggregate

  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        restaurantId,
        createdAt: {
          gte: from,
          lte: to
        },
        status: 'COMPLETED'
      }
    },
    include: {
      product: {
        include: {
          category: true
        }
      }
    }
  })

  const categoryMap = new Map<string, { name: string; value: number; count: number }>()

  items.forEach(item => {
    const categoryName = item.product.category.name
    const current = categoryMap.get(categoryName) || { name: categoryName, value: 0, count: 0 }

    current.value += Number(item.subtotal)
    current.count += item.quantity

    categoryMap.set(categoryName, current)
  })

  return Array.from(categoryMap.values())
    .sort((a, b) => b.value - a.value)
}

async function getWaiterPerformance(restaurantId: string, from: Date, to: Date) {
  // Assuming we track who created the order via createdBy (User)
  // Note: The schema might need verification if 'createdBy' exists on Order or if we use a specific relation

  // Let's check schema first. If no direct relation, we might need to rely on something else.
  // Based on previous context, Order usually has a relation to User (waiter/staff).

  // Let's assume there is a userId or similar on Order. 
  // Checking schema in thought process: Order has `userId` which links to `User`.

  const performance = await prisma.order.groupBy({
    by: ['userId'],
    where: {
      restaurantId,
      createdAt: {
        gte: from,
        lte: to
      },
      status: 'COMPLETED'
    },
    _count: {
      id: true
    },
    _sum: {
      total: true
    }
  })

  // Fetch user details
  const userIds = performance.map(p => p.userId).filter(id => id !== null) as string[]

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  })

  return performance
    .filter((p): p is typeof p & { userId: string } => p.userId !== null)
    .map(p => {
      const user = users.find(u => u.id === p.userId)
      return {
        id: p.userId,
        name: user?.name || user?.email || 'Desconocido',
        orders: p._count.id,
        sales: Number(p._sum.total || 0),
        averageTicket: Number(p._sum.total || 0) / p._count.id
      }
    })
    .sort((a, b) => b.sales - a.sales)
}

