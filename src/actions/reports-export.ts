"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { startOfDay, endOfDay, subDays, format, getDay, getHours } from "date-fns"
import { es } from "date-fns/locale"
import { createSalesWorkbook, createInventoryWorkbook, createAnalyticsWorkbook, workbookToBuffer } from "@/lib/excel-generator"

// ... (keep all existing functions) ...

export async function generateSalesExcel(startDate: Date, endDate: Date) {
  try {
    const session = await auth()
    if (!session?.user?.restaurantId) {
      return { success: false, error: "No autorizado" }
    }

    const restaurantId = session.user.restaurantId

    // Fetch orders for the period
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ["COMPLETED", "SERVED"] },
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Calculate summary
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const totalOrders = orders.length
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

    // Group by date
    const dailySalesMap = new Map<string, { sales: number; orders: number }>()
    orders.forEach((order) => {
      const dateKey = format(new Date(order.createdAt), "yyyy-MM-dd")
      const current = dailySalesMap.get(dateKey) || { sales: 0, orders: 0 }
      dailySalesMap.set(dateKey, {
        sales: current.sales + Number(order.total),
        orders: current.orders + 1,
      })
    })

    const dailySales = Array.from(dailySalesMap.entries())
      .map(([date, data]) => ({
        date: format(new Date(date), "dd/MM/yyyy"),
        sales: data.sales,
        orders: data.orders,
        avgTicket: data.sales / data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Group by product
    const productMap = new Map<string, { name: string; category: string; quantity: number; revenue: number }>()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId
        const current = productMap.get(key) || {
          name: item.product.name,
          category: item.product.category?.name || "Sin categoría",
          quantity: 0,
          revenue: 0,
        }
        productMap.set(key, {
          ...current,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + Number(item.subtotal),
        })
      })
    })

    const products = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue)

    // Group by category
    const categoryMap = new Map<string, number>()
    products.forEach((product) => {
      const current = categoryMap.get(product.category) || 0
      categoryMap.set(product.category, current + product.revenue)
    })

    const categories = Array.from(categoryMap.entries())
      .map(([name, sales]) => ({
        name,
        sales,
        percentage: totalSales > 0 ? (sales / totalSales) * 100 : 0,
      }))
      .sort((a, b) => b.sales - a.sales)

    // Payment methods
    const paymentMethodsMap = new Map<string, number>()
    orders.forEach((order) => {
      order.payments.forEach((payment) => {
        if (payment.status === "COMPLETED") {
          const current = paymentMethodsMap.get(payment.method) || 0
          paymentMethodsMap.set(payment.method, current + Number(payment.amount))
        }
      })
    })

    const paymentMethods = Array.from(paymentMethodsMap.entries()).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalSales > 0 ? (amount / totalSales) * 100 : 0,
    }))

    // Create workbook
    const workbook = createSalesWorkbook({
      summary: {
        totalSales,
        totalOrders,
        avgTicket,
        period: `${format(startDate, "dd/MM/yyyy", { locale: es })} - ${format(endDate, "dd/MM/yyyy", { locale: es })}`,
      },
      dailySales,
      products,
      categories,
      paymentMethods,
    })

    // Convert to buffer
    const buffer = workbookToBuffer(workbook)
    const base64 = buffer.toString("base64")

    return {
      success: true,
      data: base64,
      filename: `reporte-ventas-${format(startDate, "yyyyMMdd")}-${format(endDate, "yyyyMMdd")}.xlsx`,
    }
  } catch (error) {
    console.error("Error generating sales Excel:", error)
    return { success: false, error: "Error al generar el reporte" }
  }
}

export async function generateInventoryExcel() {
  try {
    const session = await auth()
    if (!session?.user?.restaurantId) {
      return { success: false, error: "No autorizado" }
    }

    const restaurantId = session.user.restaurantId

    // Fetch inventory items
    const items = await prisma.ingredient.findMany({
      where: { restaurantId },
      orderBy: {
        name: "asc",
      },
    })

    // Transform data
    const inventoryItems = items.map((item) => ({
      name: item.name,
      category: "General", // Default category since ingredients don't have categories
      currentStock: Number(item.currentStock),
      minStock: Number(item.minStock),
      unit: item.unit,
      cost: Number(item.cost),
      value: Number(item.currentStock) * Number(item.cost),
    }))

    // Get low stock items
    const lowStock = items
      .filter((item) => Number(item.currentStock) < Number(item.minStock))
      .map((item) => ({
        name: item.name,
        currentStock: Number(item.currentStock),
        minStock: Number(item.minStock),
        needed: Number(item.minStock) - Number(item.currentStock),
      }))

    // Create workbook
    const workbook = createInventoryWorkbook({
      items: inventoryItems,
      lowStock,
    })

    // Convert to buffer
    const buffer = workbookToBuffer(workbook)
    const base64 = buffer.toString("base64")

    return {
      success: true,
      data: base64,
      filename: `reporte-inventario-${format(new Date(), "yyyyMMdd")}.xlsx`,
    }
  } catch (error) {
    console.error("Error generating inventory Excel:", error)
    return { success: false, error: "Error al generar el reporte" }
  }
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "En Mesa",
  TAKEOUT: "Para Llevar",
  DELIVERY: "Delivery"
}

export async function generateAnalyticsExcel(startDate: Date, endDate: Date) {
  try {
    const session = await auth()
    if (!session?.user?.restaurantId) {
      return { success: false, error: "No autorizado" }
    }

    const restaurantId = session.user.restaurantId

    // Fetch orders for the period
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ["COMPLETED", "SERVED"] },
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Calculate summary
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const totalOrders = orders.length
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

    // === ORDER TYPES ===
    const orderTypeMap = new Map<string, { sales: number; orders: number }>()
    orders.forEach((order) => {
      const type = order.type
      const current = orderTypeMap.get(type) || { sales: 0, orders: 0 }
      orderTypeMap.set(type, {
        sales: current.sales + Number(order.total),
        orders: current.orders + 1,
      })
    })

    const orderTypes = Array.from(orderTypeMap.entries()).map(([type, data]) => ({
      type,
      label: ORDER_TYPE_LABELS[type] || type,
      totalSales: data.sales,
      orderCount: data.orders,
      averageTicket: data.orders > 0 ? data.sales / data.orders : 0,
      percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0,
    }))

    // === TOP PRODUCTS ===
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId
        const current = productMap.get(key) || {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        }
        productMap.set(key, {
          ...current,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + Number(item.subtotal),
        })
      })
    })

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20)

    // === CATEGORIES ===
    const categoryMap = new Map<string, { value: number; count: number }>()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const categoryName = item.product.category?.name || "Sin categoría"
        const current = categoryMap.get(categoryName) || { value: 0, count: 0 }
        categoryMap.set(categoryName, {
          value: current.value + Number(item.subtotal),
          count: current.count + 1,
        })
      })
    })

    const categories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.value,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value)

    // === PEAK HOURS (7x24 matrix) ===
    const peakHours: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
    orders.forEach((order) => {
      const date = new Date(order.createdAt)
      const dayOfWeek = getDay(date) // 0 = Sunday, 1 = Monday...
      // Convert to Monday=0, Sunday=6
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const hour = getHours(date)
      peakHours[adjustedDay][hour]++
    })

    // === WAITERS PERFORMANCE ===
    const waiterMap = new Map<string, { name: string; orders: number; sales: number }>()
    orders.forEach((order) => {
      if (order.user) {
        const key = order.userId!
        const current = waiterMap.get(key) || {
          name: order.user.name || "Sin nombre",
          orders: 0,
          sales: 0,
        }
        waiterMap.set(key, {
          ...current,
          orders: current.orders + 1,
          sales: current.sales + Number(order.total),
        })
      }
    })

    const waiters = Array.from(waiterMap.values())
      .map((w) => ({
        ...w,
        avgTicket: w.orders > 0 ? w.sales / w.orders : 0,
      }))
      .sort((a, b) => b.sales - a.sales)

    // Create workbook
    const workbook = createAnalyticsWorkbook({
      summary: {
        totalSales,
        totalOrders,
        avgTicket,
        period: `${format(startDate, "dd/MM/yyyy", { locale: es })} - ${format(endDate, "dd/MM/yyyy", { locale: es })}`,
      },
      orderTypes,
      topProducts,
      categories,
      peakHours,
      waiters,
    })

    // Convert to buffer
    const buffer = workbookToBuffer(workbook)
    const base64 = buffer.toString("base64")

    return {
      success: true,
      data: base64,
      filename: `reporte-analytics-${format(startDate, "yyyyMMdd")}-${format(endDate, "yyyyMMdd")}.xlsx`,
    }
  } catch (error) {
    console.error("Error generating analytics Excel:", error)
    return { success: false, error: "Error al generar el reporte" }
  }
}

// Returns raw data for client-side PDF generation
export async function getAnalyticsDataForExport(startDate: Date, endDate: Date) {
  try {
    const session = await auth()
    if (!session?.user?.restaurantId) {
      return { success: false, error: "No autorizado" }
    }

    const restaurantId = session.user.restaurantId

    // Fetch orders for the period
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ["COMPLETED", "SERVED"] },
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Calculate summary
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
    const totalOrders = orders.length
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0

    // === ORDER TYPES ===
    const orderTypeMap = new Map<string, { sales: number; orders: number }>()
    orders.forEach((order) => {
      const type = order.type
      const current = orderTypeMap.get(type) || { sales: 0, orders: 0 }
      orderTypeMap.set(type, {
        sales: current.sales + Number(order.total),
        orders: current.orders + 1,
      })
    })

    const orderTypes = Array.from(orderTypeMap.entries()).map(([type, data]) => ({
      type,
      label: ORDER_TYPE_LABELS[type] || type,
      totalSales: data.sales,
      orderCount: data.orders,
      averageTicket: data.orders > 0 ? data.sales / data.orders : 0,
      percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0,
    }))

    // === TOP PRODUCTS ===
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.productId
        const current = productMap.get(key) || {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        }
        productMap.set(key, {
          ...current,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + Number(item.subtotal),
        })
      })
    })

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20)

    // === CATEGORIES ===
    const categoryMap = new Map<string, { value: number; count: number }>()
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const categoryName = item.product.category?.name || "Sin categoría"
        const current = categoryMap.get(categoryName) || { value: 0, count: 0 }
        categoryMap.set(categoryName, {
          value: current.value + Number(item.subtotal),
          count: current.count + 1,
        })
      })
    })

    const categories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.value,
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value)

    // === WAITERS PERFORMANCE ===
    const waiterMap = new Map<string, { name: string; orders: number; sales: number }>()
    orders.forEach((order) => {
      if (order.user) {
        const key = order.userId!
        const current = waiterMap.get(key) || {
          name: order.user.name || "Sin nombre",
          orders: 0,
          sales: 0,
        }
        waiterMap.set(key, {
          ...current,
          orders: current.orders + 1,
          sales: current.sales + Number(order.total),
        })
      }
    })

    const waiters = Array.from(waiterMap.values())
      .map((w) => ({
        ...w,
        avgTicket: w.orders > 0 ? w.sales / w.orders : 0,
      }))
      .sort((a, b) => b.sales - a.sales)

    return {
      success: true,
      data: {
        summary: {
          totalSales,
          totalOrders,
          avgTicket,
          period: `${format(startDate, "dd/MM/yyyy", { locale: es })} - ${format(endDate, "dd/MM/yyyy", { locale: es })}`,
        },
        orderTypes,
        topProducts,
        categories,
        waiters,
      },
    }
  } catch (error) {
    console.error("Error getting analytics data:", error)
    return { success: false, error: "Error al obtener los datos" }
  }
}
