"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { startOfDay, endOfDay, subDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { createSalesWorkbook, createInventoryWorkbook, workbookToBuffer } from "@/lib/excel-generator"

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
