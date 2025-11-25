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
