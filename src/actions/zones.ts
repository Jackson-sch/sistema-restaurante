"use server"

import { prisma } from "@/lib/prisma"
import { zoneSchema, type ZoneInput } from "@/lib/schemas/zones"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { requirePermission } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/lib/permissions"

export async function getZones() {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        const zones = await prisma.zone.findMany({
            where: { restaurantId: session.user.restaurantId },
            orderBy: { order: "asc" },
            include: {
                tables: true
            }
        })
        return { success: true, data: zones }
    } catch (error) {
        return { success: false, error: "Error al obtener zonas" }
    }
}

export async function createZone(data: ZoneInput) {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        await requirePermission(PERMISSIONS.ZONES_CREATE)

        const validated = zoneSchema.parse(data)

        await prisma.zone.create({
            data: {
                ...validated,
                restaurantId: session.user.restaurantId
            }
        })

        revalidatePath("/dashboard/zones")
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: "Error al crear la zona" }
    }
}

export async function updateZone(id: string, data: Partial<ZoneInput>) {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        await requirePermission(PERMISSIONS.ZONES_UPDATE)

        const validated = zoneSchema.partial().parse(data)

        await prisma.zone.update({
            where: {
                id,
                restaurantId: session.user.restaurantId
            },
            data: validated
        })

        revalidatePath("/dashboard/zones")
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: "Error al actualizar la zona" }
    }
}

export async function deleteZone(id: string) {
    const session = await auth()
    if (!session?.user?.restaurantId) return { success: false, error: "No autorizado" }

    try {
        await requirePermission(PERMISSIONS.ZONES_DELETE)

        await prisma.zone.delete({
            where: {
                id,
                restaurantId: session.user.restaurantId
            }
        })
        revalidatePath("/dashboard/zones")
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: "Error al eliminar la zona" }
    }
}
