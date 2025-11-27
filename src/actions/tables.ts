"use server"

import { prisma } from "@/lib/prisma"
import { tableSchema, type TableInput } from "@/lib/schemas/tables"
import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/lib/permissions"

export async function getTables() {
    try {
        const rawTables = await prisma.table.findMany({
            orderBy: { number: "asc" },
            include: {
                orders: {
                    where: {
                        status: {
                            notIn: ['COMPLETED', 'CANCELLED']
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                zone: true
            }
        })

        // Transform Decimal fields to numbers for client component serialization
        const tables = rawTables.map(table => ({
            ...table,
            orders: table.orders.map(order => ({
                ...order,
                subtotal: Number(order.subtotal),
                tax: Number(order.tax),
                discount: Number(order.discount || 0),
                tip: Number(order.tip || 0),
                total: Number(order.total),
            }))
        }))

        return { success: true, data: tables }
    } catch (error) {
        return { success: false, error: "Error al obtener mesas" }
    }
}

import { getRestaurantId } from "@/lib/restaurant"

export async function createTable(data: TableInput) {
    try {
        await requirePermission(PERMISSIONS.TABLES_CREATE)

        const validated = tableSchema.parse(data)
        const restaurantId = await getRestaurantId()

        const existing = await prisma.table.findFirst({
            where: {
                number: validated.number,
                restaurantId
            }
        })

        if (existing) {
            return { success: false, error: "Ya existe una mesa con este número" }
        }

        await prisma.table.create({
            data: {
                ...validated,
                restaurantId
            }
        })

        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: "Error al crear la mesa" }
    }
}

export async function updateTableStatus(id: string, status: "AVAILABLE" | "OCCUPIED" | "RESERVED") {
    try {
        await prisma.table.update({
            where: { id },
            data: { status }
        })
        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al actualizar estado de la mesa" }
    }
}

export async function updateTable(id: string, data: Partial<TableInput>) {
    try {
        await requirePermission(PERMISSIONS.TABLES_UPDATE)

        const validated = tableSchema.partial().parse(data)

        // If number is being updated, check for duplicates
        if (validated.number) {
            const restaurantId = await getRestaurantId()
            const existing = await prisma.table.findFirst({
                where: {
                    number: validated.number,
                    restaurantId,
                    NOT: { id }
                }
            })

            if (existing) {
                return { success: false, error: "Ya existe una mesa con este número" }
            }
        }

        await prisma.table.update({
            where: { id },
            data: validated
        })

        revalidatePath("/dashboard/tables")
        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: "Error al actualizar la mesa" }
    }
}


export async function deleteTable(id: string) {
    try {
        await requirePermission(PERMISSIONS.TABLES_DELETE)

        // Check if table has active orders
        const table = await prisma.table.findUnique({
            where: { id },
            include: {
                orders: {
                    where: {
                        status: {
                            notIn: ['COMPLETED', 'CANCELLED']
                        }
                    }
                }
            }
        });

        if (!table) {
            return { success: false, error: 'Mesa no encontrada' };
        }

        if (table.orders.length > 0) {
            return { success: false, error: 'No puedes eliminar una mesa con órdenes activas' };
        }

        await prisma.table.delete({
            where: { id }
        });

        revalidatePath('/dashboard/tables');
        revalidatePath('/dashboard/zones');
        return { success: true };
    } catch (error) {
        if (error instanceof Error) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Error al eliminar la mesa' };
    }
}
