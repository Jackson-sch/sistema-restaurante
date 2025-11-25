"use server"

import { prisma } from "@/lib/prisma"
import { categorySchema, type CategoryInput } from "@/lib/schemas/menu"
import { revalidatePath } from "next/cache"
import { getRestaurantId } from "@/lib/restaurant"

export async function getCategories() {
    try {
        const restaurantId = await getRestaurantId()
        const categories = await prisma.category.findMany({
            where: { restaurantId },
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { products: true } } }
        })
        return { success: true, data: categories }
    } catch (error) {
        return { success: false, error: "Error al obtener categorías" }
    }
}

export async function createCategory(data: CategoryInput) {
    try {
        const validated = categorySchema.parse(data)
        const restaurantId = await getRestaurantId()

        const existing = await prisma.category.findFirst({
            where: {
                slug: validated.slug,
                restaurantId
            }
        })

        if (existing) {
            return { success: false, error: "Ya existe una categoría con este slug" }
        }

        const newCategory = await prisma.category.create({
            data: {
                ...validated,
                restaurantId
            }
        })

        revalidatePath("/dashboard/menu/categories")
        return { success: true, data: newCategory }
    } catch (error) {
        return { success: false, error: "Error al crear la categoría" }
    }
}

export async function updateCategory(id: string, data: CategoryInput) {
    try {
        const validated = categorySchema.parse(data)
        const restaurantId = await getRestaurantId()

        const existing = await prisma.category.findFirst({
            where: {
                slug: validated.slug,
                restaurantId,
                NOT: { id }
            }
        })

        if (existing) {
            return { success: false, error: "Ya existe una categoría con este slug" }
        }

        const updatedCategory = await prisma.category.update({
            where: { id },
            data: validated
        })

        revalidatePath("/dashboard/menu/categories")
        return { success: true, data: updatedCategory }
    } catch (error) {
        return { success: false, error: "Error al actualizar la categoría" }
    }
}

export async function deleteCategory(id: string) {
    try {
        await prisma.category.delete({
            where: { id }
        })
        revalidatePath("/dashboard/menu/categories")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al eliminar la categoría" }
    }
}
