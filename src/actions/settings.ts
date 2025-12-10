"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { restaurantSettingsSchema, type RestaurantSettingsInput } from "@/lib/schemas/settings"

export async function getRestaurantSettings() {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: session.user.restaurantId }
        })

        if (!restaurant) return { success: false, error: "Restaurante no encontrado" }

        return { success: true, data: restaurant }
    } catch (error) {
        return { success: false, error: "Error al obtener configuración" }
    }
}

export async function updateRestaurantSettings(data: RestaurantSettingsInput) {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        const validated = restaurantSettingsSchema.parse(data)

        await prisma.restaurant.update({
            where: { id: session.user.restaurantId },
            data: validated
        })

        revalidatePath("/dashboard/settings")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al actualizar configuración" }
    }
}

export async function updateCashSettings(data: { cashTolerance: number }) {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: session.user.restaurantId },
            select: { settings: true }
        })

        const currentSettings = (restaurant?.settings as Record<string, any>) || {}
        const newSettings = {
            ...currentSettings,
            cashTolerance: data.cashTolerance
        }

        await prisma.restaurant.update({
            where: { id: session.user.restaurantId },
            data: { settings: newSettings }
        })

        revalidatePath("/dashboard/settings")
        revalidatePath("/dashboard/cash-register")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al actualizar configuración de caja" }
    }
}

export async function getCashSettings() {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: session.user.restaurantId },
            select: { settings: true }
        })

        const settings = (restaurant?.settings as Record<string, any>) || {}
        return {
            success: true,
            data: {
                cashTolerance: settings.cashTolerance ?? 5
            }
        }
    } catch (error) {
        return { success: false, error: "Error al obtener configuración de caja" }
    }
}
