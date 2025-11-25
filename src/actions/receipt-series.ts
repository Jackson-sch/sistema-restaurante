"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { receiptSeriesSchema, type ReceiptSeriesInput } from "@/lib/schemas/receipt-series"

export async function getReceiptSeries() {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        const series = await prisma.receiptSeries.findMany({
            where: { restaurantId: session.user.restaurantId },
            orderBy: { type: 'asc' }
        })

        return { success: true, data: series }
    } catch (error) {
        return { success: false, error: "Error al obtener series" }
    }
}

export async function createReceiptSeries(data: ReceiptSeriesInput) {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        const validated = receiptSeriesSchema.parse(data)

        // Check for duplicates
        const existing = await prisma.receiptSeries.findFirst({
            where: {
                restaurantId: session.user.restaurantId,
                type: validated.type,
                series: validated.series
            }
        })

        if (existing) {
            return { success: false, error: "Ya existe una serie con este tipo y código" }
        }

        await prisma.receiptSeries.create({
            data: {
                restaurantId: session.user.restaurantId,
                ...validated
            }
        })

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        console.error("Error creating receipt series:", error)
        return { success: false, error: "Error al crear serie" }
    }
}

export async function updateReceiptSeries(id: string, data: Partial<ReceiptSeriesInput>) {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        await prisma.receiptSeries.update({
            where: { id },
            data
        })

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al actualizar serie" }
    }
}

export async function deleteReceiptSeries(id: string) {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        await prisma.receiptSeries.delete({
            where: { id }
        })

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al eliminar serie" }
    }
}
