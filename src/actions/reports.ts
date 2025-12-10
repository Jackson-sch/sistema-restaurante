"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { startOfDay, endOfDay, subDays, format } from "date-fns"

export async function getSalesReport(startDate?: Date, endDate?: Date) {
    await requirePermission(PERMISSIONS.REPORTS_SALES)

    const session = await auth()
    if (!session?.user?.restaurantId) {
        return { success: false, error: "No se encontró el restaurante" }
    }

    const restaurantId = session.user.restaurantId

    // Default to last 30 days if not provided
    const start = startDate || subDays(new Date(), 30)
    const end = endDate || new Date()

    // Calculate previous period for comparison
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const previousStart = subDays(start, periodDays)
    const previousEnd = subDays(start, 1)

    try {
        // Fetch current period orders
        const orders = await prisma.order.findMany({
            where: {
                restaurantId,
                status: { in: ["COMPLETED", "SERVED"] },
                createdAt: {
                    gte: startOfDay(start),
                    lte: endOfDay(end),
                },
            },
            include: {
                payments: true,
            },
        })

        // Fetch previous period orders for comparison
        const previousOrders = await prisma.order.findMany({
            where: {
                restaurantId,
                status: { in: ["COMPLETED", "SERVED"] },
                createdAt: {
                    gte: startOfDay(previousStart),
                    lte: endOfDay(previousEnd),
                },
            },
        })

        // Current period metrics
        const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0)
        const totalOrders = orders.length
        const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0

        // Previous period metrics
        const previousTotalSales = previousOrders.reduce((sum, order) => sum + Number(order.total), 0)
        const previousTotalOrders = previousOrders.length
        const previousAverageTicket = previousTotalOrders > 0 ? previousTotalSales / previousTotalOrders : 0

        // Calculate trend percentages
        const calculateTrend = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0
            return ((current - previous) / previous) * 100
        }

        const salesTrend = calculateTrend(totalSales, previousTotalSales)
        const ordersTrend = calculateTrend(totalOrders, previousTotalOrders)
        const ticketTrend = calculateTrend(averageTicket, previousAverageTicket)

        // 2. Sales by Payment Method
        const paymentMethods: Record<string, number> = {}

        orders.forEach(order => {
            order.payments.forEach(payment => {
                if (payment.status === "COMPLETED") {
                    const method = payment.method
                    paymentMethods[method] = (paymentMethods[method] || 0) + Number(payment.amount)
                }
            })
        })

        const salesByMethod = Object.entries(paymentMethods).map(([method, amount]) => ({
            method,
            amount,
        })).sort((a, b) => b.amount - a.amount)

        // 3. Sales by Order Type
        const salesByType: Record<string, number> = {}
        orders.forEach(order => {
            const type = order.type
            salesByType[type] = (salesByType[type] || 0) + Number(order.total)
        })

        const salesByTypeArray = Object.entries(salesByType).map(([type, amount]) => ({
            type,
            amount,
        })).sort((a, b) => b.amount - a.amount)

        // 4. Daily Sales Trend
        const dailySales: Record<string, number> = {}

        // Initialize all days in range with 0
        let currentDate = new Date(start)
        while (currentDate <= end) {
            const dateKey = format(currentDate, "yyyy-MM-dd")
            dailySales[dateKey] = 0
            currentDate.setDate(currentDate.getDate() + 1)
        }

        orders.forEach(order => {
            const dateKey = format(order.createdAt, "yyyy-MM-dd")
            if (dailySales[dateKey] !== undefined) {
                dailySales[dateKey] += Number(order.total)
            }
        })

        const dailySalesTrend = Object.entries(dailySales).map(([date, amount]) => ({
            date,
            amount,
        })).sort((a, b) => a.date.localeCompare(b.date))

        return {
            success: true,
            data: {
                summary: {
                    totalSales,
                    totalOrders,
                    averageTicket,
                    // Trend percentages compared to previous period
                    salesTrend: Math.round(salesTrend * 10) / 10,
                    ordersTrend: Math.round(ordersTrend * 10) / 10,
                    ticketTrend: Math.round(ticketTrend * 10) / 10,
                },
                salesByMethod,
                salesByType: salesByTypeArray,
                salesTrend: dailySalesTrend,
            },
        }

    } catch (error) {
        console.error("Error generating sales report:", error)
        return { success: false, error: "Error al generar el reporte" }
    }
}

export async function getProductPerformanceReport(startDate?: Date, endDate?: Date) {
    await requirePermission(PERMISSIONS.REPORTS_SALES) // Using same permission for now

    const session = await auth()
    if (!session?.user?.restaurantId) {
        return { success: false, error: "No se encontró el restaurante" }
    }

    const restaurantId = session.user.restaurantId

    const start = startDate || subDays(new Date(), 30)
    const end = endDate || new Date()

    try {
        // Fetch completed order items in range
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    restaurantId,
                    status: { in: ["COMPLETED", "SERVED"] },
                    createdAt: {
                        gte: startOfDay(start),
                        lte: endOfDay(end),
                    },
                },
            },
            include: {
                product: {
                    include: {
                        category: true,
                    },
                },
            },
        })

        // 1. Top Selling Products
        const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {}

        // 2. Category Performance
        const categoryStats: Record<string, { name: string; revenue: number; quantity: number }> = {}

        orderItems.forEach(item => {
            // Product Stats
            const productId = item.productId
            if (!productStats[productId]) {
                productStats[productId] = {
                    name: item.product.name,
                    quantity: 0,
                    revenue: 0,
                }
            }
            productStats[productId].quantity += item.quantity
            productStats[productId].revenue += Number(item.subtotal)

            // Category Stats
            const categoryId = item.product.categoryId
            if (!categoryStats[categoryId]) {
                categoryStats[categoryId] = {
                    name: item.product.category.name,
                    quantity: 0,
                    revenue: 0,
                }
            }
            categoryStats[categoryId].quantity += item.quantity
            categoryStats[categoryId].revenue += Number(item.subtotal)
        })

        const topProducts = Object.values(productStats)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10) // Top 10

        const topCategories = Object.values(categoryStats)
            .sort((a, b) => b.revenue - a.revenue)

        return {
            success: true,
            data: {
                topProducts,
                topCategories,
            },
        }

    } catch (error) {
        console.error("Error generating product report:", error)
        return { success: false, error: "Error al generar el reporte de productos" }
    }
}

export async function getStaffPerformanceReport(startDate?: Date, endDate?: Date) {
    await requirePermission(PERMISSIONS.REPORTS_SALES)

    const session = await auth()
    if (!session?.user?.restaurantId) {
        return { success: false, error: "No se encontró el restaurante" }
    }

    const restaurantId = session.user.restaurantId
    const start = startDate || subDays(new Date(), 30)
    const end = endDate || new Date()

    try {
        // 1. Waiter Performance (Orders created)
        const orders = await prisma.order.findMany({
            where: {
                restaurantId,
                status: { in: ["COMPLETED", "SERVED"] },
                createdAt: {
                    gte: startOfDay(start),
                    lte: endOfDay(end),
                },
                userId: { not: null }
            },
            include: {
                user: true,
            },
        })

        const waiterStats: Record<string, { name: string; role: string; totalSales: number; orderCount: number }> = {}

        orders.forEach(order => {
            if (!order.user) return
            const userId = order.user.id
            if (!waiterStats[userId]) {
                waiterStats[userId] = {
                    name: order.user.name || "Sin nombre",
                    role: order.user.role,
                    totalSales: 0,
                    orderCount: 0,
                }
            }
            waiterStats[userId].totalSales += Number(order.total)
            waiterStats[userId].orderCount += 1
        })

        const topWaiters = Object.values(waiterStats)
            .sort((a, b) => b.totalSales - a.totalSales)

        // 2. Cashier Performance (Payments processed)
        const payments = await prisma.payment.findMany({
            where: {
                order: {
                    restaurantId,
                },
                status: "COMPLETED",
                createdAt: {
                    gte: startOfDay(start),
                    lte: endOfDay(end),
                },
                cashierId: { not: null }
            },
            include: {
                cashier: true,
            },
        })

        const cashierStats: Record<string, { name: string; role: string; totalCollected: number; transactionCount: number }> = {}

        payments.forEach(payment => {
            if (!payment.cashier) return
            const cashierId = payment.cashier.id
            if (!cashierStats[cashierId]) {
                cashierStats[cashierId] = {
                    name: payment.cashier.name || "Sin nombre",
                    role: payment.cashier.role,
                    totalCollected: 0,
                    transactionCount: 0,
                }
            }
            cashierStats[cashierId].totalCollected += Number(payment.amount)
            cashierStats[cashierId].transactionCount += 1
        })

        const topCashiers = Object.values(cashierStats)
            .sort((a, b) => b.totalCollected - a.totalCollected)

        return {
            success: true,
            data: {
                waiters: topWaiters,
                cashiers: topCashiers,
            },
        }

    } catch (error) {
        console.error("Error generating staff report:", error)
        return { success: false, error: "Error al generar el reporte de personal" }
    }
}

export async function getInventoryReport() {
    await requirePermission(PERMISSIONS.REPORTS_SALES)

    const session = await auth()
    if (!session?.user?.restaurantId) {
        return { success: false, error: "No se encontró el restaurante" }
    }

    const restaurantId = session.user.restaurantId

    try {
        // Fetch all ingredients
        const ingredients = await prisma.ingredient.findMany({
            where: {
                restaurantId,
            },
            orderBy: {
                name: "asc",
            },
        })

        // Calculate stats
        const totalIngredients = ingredients.length
        const totalValue = ingredients.reduce((sum, ing) => sum + (Number(ing.currentStock) * Number(ing.cost)), 0)

        const lowStockIngredients = ingredients.filter(ing => Number(ing.currentStock) <= Number(ing.minStock))
        const lowStockCount = lowStockIngredients.length

        // Recent movements (last 20)
        const recentMovements = await prisma.stockMovement.findMany({
            where: {
                ingredient: {
                    restaurantId,
                },
            },
            include: {
                ingredient: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        })

        return {
            success: true,
            data: {
                summary: {
                    totalIngredients,
                    totalValue,
                    lowStockCount,
                },
                ingredients: ingredients.map(ing => ({
                    id: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    currentStock: Number(ing.currentStock),
                    minStock: Number(ing.minStock),
                    cost: Number(ing.cost),
                    value: Number(ing.currentStock) * Number(ing.cost),
                    restaurantId: ing.restaurantId,
                    createdAt: ing.createdAt,
                    updatedAt: ing.updatedAt,
                })),
                lowStockIngredients: lowStockIngredients.map(ing => ({
                    id: ing.id,
                    name: ing.name,
                    unit: ing.unit,
                    currentStock: Number(ing.currentStock),
                    minStock: Number(ing.minStock),
                })),
                recentMovements: recentMovements.map(mov => ({
                    id: mov.id,
                    type: mov.type,
                    quantity: Number(mov.quantity),
                    reason: mov.reason,
                    reference: mov.reference,
                    createdAt: mov.createdAt,
                    ingredientId: mov.ingredientId,
                    ingredientName: mov.ingredient.name,
                })),
            },
        }

    } catch (error) {
        console.error("Error generating inventory report:", error)
        return { success: false, error: "Error al generar el reporte de inventario" }
    }
}

export async function getCashRegisterReport(startDate?: Date, endDate?: Date) {
    await requirePermission(PERMISSIONS.REPORTS_SALES)

    const session = await auth()
    if (!session?.user?.restaurantId) {
        return { success: false, error: "No se encontró el restaurante" }
    }

    const restaurantId = session.user.restaurantId
    const start = startDate || subDays(new Date(), 30)
    const end = endDate || new Date()

    try {
        const cashRegisters = await prisma.cashRegister.findMany({
            where: {
                user: {
                    restaurantId,
                },
                openedAt: {
                    gte: startOfDay(start),
                    lte: endOfDay(end),
                },
            },
            include: {
                user: true,
            },
            orderBy: {
                openedAt: "desc",
            },
        })

        // Calculate stats
        let totalIncome = 0
        let totalDiscrepancy = 0
        let discrepancyCount = 0

        const sessions = cashRegisters.map(register => {
            const diff = register.difference ? Number(register.difference) : 0
            if (diff !== 0) {
                totalDiscrepancy += diff
                discrepancyCount++
            }

            // Assuming closingCash is the total money in drawer at end
            // Or we could sum up transactions. For now let's use closingCash if available
            if (register.closingCash) {
                totalIncome += Number(register.closingCash) - Number(register.openingCash)
            }

            return {
                id: register.id,
                user: register.user.name || "Usuario",
                openedAt: register.openedAt,
                closedAt: register.closedAt,
                openingCash: Number(register.openingCash),
                closingCash: register.closingCash ? Number(register.closingCash) : null,
                expectedCash: register.expectedCash ? Number(register.expectedCash) : null,
                difference: diff,
                status: register.closedAt ? "Cerrada" : "Abierta",
            }
        })

        return {
            success: true,
            data: {
                summary: {
                    totalSessions: cashRegisters.length,
                    totalDiscrepancy,
                    discrepancyCount,
                },
                sessions,
            },
        }

    } catch (error) {
        console.error("Error generating cash register report:", error)
        return { success: false, error: "Error al generar el reporte de caja" }
    }
}
