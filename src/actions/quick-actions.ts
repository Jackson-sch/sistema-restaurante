"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Get count of active orders (PENDING or IN_PROGRESS status)
 */
export async function getActiveOrdersCount() {
  try {
    const session = await auth()
    if (!session?.user?.restaurantId) {
      return { success: false, error: "No autorizado", count: 0 }
    }

    const count = await prisma.order.count({
      where: {
        restaurantId: session.user.restaurantId,
        status: {
          in: ["PENDING", "IN_PROGRESS"]
        }
      }
    })

    return { success: true, count }
  } catch (error) {
    console.error("Error getting active orders count:", error)
    return { success: false, error: "Error al obtener órdenes activas", count: 0 }
  }
}

/**
 * Get cash register status (open/closed)
 */
export async function getCashRegisterStatus() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado", isOpen: false }
    }

    // Find the most recent cash register session for this user
    const latestSession = await prisma.cashRegister.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        openedAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    const isOpen = latestSession ? latestSession.closedAt === null : false

    return {
      success: true,
      isOpen,
      session: latestSession ? {
        id: latestSession.id,
        openedAt: latestSession.openedAt,
        closedAt: latestSession.closedAt,
        openingCash: Number(latestSession.openingCash),
        closingCash: latestSession.closingCash ? Number(latestSession.closingCash) : null,
        expectedCash: latestSession.expectedCash ? Number(latestSession.expectedCash) : null,
        difference: latestSession.difference ? Number(latestSession.difference) : null,
        turn: latestSession.turn,
        notes: latestSession.notes,
        user: latestSession.user
      } : null
    }
  } catch (error) {
    console.error("Error getting cash register status:", error)
    return { success: false, error: "Error al obtener estado de caja", isOpen: false }
  }
}

/**
 * Open cash register
 */
export async function openCashRegister(openingCash: number, turn?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" }
    }

    // Check if there's already an open session
    const existingSession = await prisma.cashRegister.findFirst({
      where: {
        userId: session.user.id,
        closedAt: null
      }
    })

    if (existingSession) {
      return { success: false, error: "Ya existe una caja abierta" }
    }

    // Create new cash register session
    const cashRegister = await prisma.cashRegister.create({
      data: {
        userId: session.user.id,
        openingCash,
        turn: turn || null
      }
    })

    revalidatePath("/dashboard/tables")
    revalidatePath("/dashboard/orders")

    return {
      success: true,
      data: {
        id: cashRegister.id,
        userId: cashRegister.userId,
        turn: cashRegister.turn,
        openingCash: Number(cashRegister.openingCash),
        openedAt: cashRegister.openedAt,
        closedAt: cashRegister.closedAt
      }
    }
  } catch (error) {
    console.error("Error opening cash register:", error)
    return { success: false, error: "Error al abrir caja" }
  }
}

/**
 * Close cash register
 */
export async function closeCashRegister(cashRegisterId: string, closingCash: number, notes?: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" }
    }

    // Get cash register and calculate expected cash
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      include: {
        orders: {
          include: {
            payments: true
          }
        },
        transactions: true
      }
    })

    if (!cashRegister) {
      return { success: false, error: "Caja no encontrada" }
    }

    if (cashRegister.closedAt) {
      return { success: false, error: "Esta caja ya está cerrada" }
    }

    // Calculate expected cash
    const cashPayments = cashRegister.orders.reduce((sum, order) => {
      const cashAmount = order.payments
        .filter(p => p.method === 'CASH')
        .reduce((s, p) => s + Number(p.amount), 0)
      return sum + cashAmount
    }, 0)

    const transactions = cashRegister.transactions.reduce((sum, t) => {
      if (t.type === 'INCOME') return sum + Number(t.amount)
      if (t.type === 'EXPENSE' || t.type === 'WITHDRAWAL') return sum - Number(t.amount)
      return sum
    }, 0)

    const expectedCash = Number(cashRegister.openingCash) + cashPayments + transactions
    const difference = closingCash - expectedCash

    // Update cash register
    const updated = await prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: {
        closedAt: new Date(),
        closingCash,
        expectedCash,
        difference,
        notes
      }
    })

    revalidatePath("/dashboard/tables")
    revalidatePath("/dashboard/orders")

    return {
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        turn: updated.turn,
        openingCash: Number(updated.openingCash),
        closingCash: Number(updated.closingCash),
        expectedCash: Number(updated.expectedCash),
        difference: Number(updated.difference),
        notes: updated.notes,
        openedAt: updated.openedAt,
        closedAt: updated.closedAt
      }
    }
  } catch (error) {
    console.error("Error closing cash register:", error)
    return { success: false, error: "Error al cerrar caja" }
  }
}


/**
 * Get unread notifications count
 * TODO: Implement notifications system
 */
export async function getUnreadNotificationsCount() {
  try {
    const session = await auth()
    if (!session?.user?.restaurantId) {
      return { success: false, error: "No autorizado", count: 0 }
    }

    // Placeholder - will implement when notifications system is ready
    return { success: true, count: 0, notifications: [] }
  } catch (error) {
    console.error("Error getting notifications:", error)
    return { success: false, error: "Error al obtener notificaciones", count: 0 }
  }
}
