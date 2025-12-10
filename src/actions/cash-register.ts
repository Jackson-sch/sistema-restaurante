"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import {
    openShiftSchema,
    closeShiftSchema,
    transactionSchema,
    type OpenShiftInput,
    type CloseShiftInput,
    type TransactionInput
} from "@/lib/schemas/cash-register"
import { requirePermission } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/lib/permissions"

export async function checkOpenShift() {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "No autorizado" }

    try {
        const openShift = await prisma.cashRegister.findFirst({
            where: {
                userId: session.user.id,
                closedAt: null
            },
            include: {
                transactions: true,
                orders: {
                    select: {
                        total: true,
                        payments: true
                    }
                }
            }
        })

        return { success: true, data: openShift }
    } catch (error) {
        return { success: false, error: "Error al verificar caja" }
    }
}

export async function openShift(data: OpenShiftInput) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "No autorizado" }

    // Verify user exists in database (in case of DB reset with active session)
    const userExists = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!userExists) {
        return { success: false, error: "Usuario no encontrado. Por favor cierra sesión y vuelve a ingresar." }
    }

    try {
        await requirePermission(PERMISSIONS.CASH_REGISTER_OPEN);

        // Check if already open
        const existing = await prisma.cashRegister.findFirst({
            where: {
                userId: session.user.id,
                closedAt: null
            }
        })

        if (existing) {
            return { success: false, error: "Ya tienes una caja abierta" }
        }

        const validated = openShiftSchema.parse(data)

        await prisma.cashRegister.create({
            data: {
                userId: session.user.id,
                openingCash: validated.openingCash,
                turn: validated.turn,
                notes: validated.notes,
            }
        })

        revalidatePath("/dashboard/cash-register")
        return { success: true }
    } catch (error) {
        console.error("Error opening shift:", error)
        return { success: false, error: "Error al abrir caja" }
    }
}

export async function closeShift(id: string, data: CloseShiftInput) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "No autorizado" }

    try {
        await requirePermission(PERMISSIONS.CASH_REGISTER_CLOSE);

        const validated = closeShiftSchema.parse(data)

        // Calculate expected cash
        const shift = await prisma.cashRegister.findUnique({
            where: { id },
            include: {
                transactions: true,
                orders: {
                    include: {
                        payments: true
                    }
                }
            }
        })

        if (!shift) return { success: false, error: "Caja no encontrada" }
        if (shift.closedAt) return { success: false, error: "La caja ya está cerrada" }

        // Start with opening cash
        let expectedCash = Number(shift.openingCash)

        // Add manual transactions
        shift.transactions.forEach(tx => {
            if (tx.type === 'INCOME') expectedCash += Number(tx.amount)
            if (tx.type === 'EXPENSE' || tx.type === 'WITHDRAWAL') expectedCash -= Number(tx.amount)
        })

        // Add order payments (only CASH)
        shift.orders.forEach(order => {
            order.payments.forEach(payment => {
                if (payment.method === 'CASH' && payment.status === 'COMPLETED') {
                    // Solo contar pagos realizados después de la apertura de caja
                    if (payment.createdAt >= shift.openedAt) {
                        expectedCash += Number(payment.amount)
                    }
                }
            })
        })

        const difference = validated.closingCash - expectedCash

        await prisma.cashRegister.update({
            where: { id },
            data: {
                closingCash: validated.closingCash,
                expectedCash,
                difference,
                closedAt: new Date(),
                denominationBreakdown: validated.useDenominations && validated.denominations
                    ? validated.denominations
                    : undefined,
                notes: validated.notes ? `${shift.notes || ''}\nCierre: ${validated.notes}` : shift.notes
            }
        })

        revalidatePath("/dashboard/cash-register")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al cerrar caja" }
    }
}

export async function addTransaction(cashRegisterId: string, data: TransactionInput) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "No autorizado" }

    try {
        const validated = transactionSchema.parse(data)

        await prisma.cashTransaction.create({
            data: {
                cashRegisterId,
                ...validated
            }
        })

        revalidatePath("/dashboard/cash-register")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al registrar movimiento" }
    }
}

export async function getShiftSummary(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: "No autorizado" }

    try {
        const shift = await prisma.cashRegister.findUnique({
            where: { id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' }
                },
                orders: {
                    include: {
                        payments: true,
                        items: true
                    }
                }
            }
        })

        if (!shift) return { success: false, error: "Caja no encontrada" }

        // Calculate totals
        let totalSales = 0
        let totalIncome = 0
        let totalExpenses = 0
        let cashSales = 0
        let cardSales = 0
        let otherSales = 0

        shift.transactions.forEach(tx => {
            if (tx.type === 'INCOME') totalIncome += Number(tx.amount)
            if (tx.type === 'EXPENSE' || tx.type === 'WITHDRAWAL') totalExpenses += Number(tx.amount)
        })

        shift.orders.forEach(order => {
            totalSales += Number(order.total)
            order.payments.forEach(payment => {
                if (payment.status === 'COMPLETED') {
                    // Solo contar pagos dentro del periodo del turno
                    const isWithinShift = payment.createdAt >= shift.openedAt &&
                        (!shift.closedAt || payment.createdAt <= shift.closedAt);

                    if (isWithinShift) {
                        if (payment.method === 'CASH') cashSales += Number(payment.amount)
                        else if (payment.method === 'CARD') cardSales += Number(payment.amount)
                        else otherSales += Number(payment.amount)
                    }
                }
            })
        })

        // Convert Decimal to number for client components
        const serializedShift = {
            ...shift,
            openingCash: Number(shift.openingCash),
            closingCash: shift.closingCash ? Number(shift.closingCash) : null,
            expectedCash: shift.expectedCash ? Number(shift.expectedCash) : null,
            difference: shift.difference ? Number(shift.difference) : null,
            transactions: shift.transactions.map(tx => ({
                ...tx,
                amount: Number(tx.amount)
            })),
            orders: shift.orders.map(order => ({
                ...order,
                subtotal: Number(order.subtotal),
                tax: Number(order.tax),
                discount: Number(order.discount),
                tip: Number(order.tip),
                total: Number(order.total),
                payments: order.payments.map(payment => ({
                    ...payment,
                    amount: Number(payment.amount)
                })),
                items: order.items.map(item => ({
                    ...item,
                    unitPrice: Number(item.unitPrice),
                    subtotal: Number(item.subtotal)
                }))
            })),
            summary: {
                totalSales,
                totalIncome,
                totalExpenses,
                cashSales,
                cardSales,
                otherSales,
                currentCash: Number(shift.openingCash) + totalIncome - totalExpenses + cashSales
            }
        }

        return {
            success: true,
            data: serializedShift
        }
    } catch (error) {
        return { success: false, error: "Error al obtener resumen" }
    }
}

export async function getShiftHistory({
    page = 1,
    limit = 10,
    startDate,
    endDate
}: {
    page?: number
    limit?: number
    startDate?: Date
    endDate?: Date
}) {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    const skip = (page - 1) * limit

    try {
        const where: any = {
            user: {
                restaurantId: session.user.restaurantId
            },
            closedAt: {
                not: null
            }
        }

        if (startDate && endDate) {
            where.openedAt = {
                gte: startDate,
                lte: endDate
            }
        }

        const [shifts, total] = await Promise.all([
            prisma.cashRegister.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    openedAt: 'desc'
                },
                skip,
                take: limit
            }),
            prisma.cashRegister.count({ where })
        ])

        // Serialize decimals
        const serializedShifts = shifts.map(shift => ({
            ...shift,
            openingCash: Number(shift.openingCash),
            closingCash: shift.closingCash ? Number(shift.closingCash) : null,
            expectedCash: shift.expectedCash ? Number(shift.expectedCash) : null,
            difference: shift.difference ? Number(shift.difference) : null,
        }))

        return {
            success: true,
            data: serializedShifts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    } catch (error) {
        console.error("Error fetching shift history:", error)
        return { success: false, error: "Error al obtener historial" }
    }
}
