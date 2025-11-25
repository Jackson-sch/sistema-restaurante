"use server"

import { prisma } from "@/lib/prisma"
import { productSchema, type ProductInput } from "@/lib/schemas/menu"
import { revalidatePath } from "next/cache"

import { type ProductWithCategory } from "@/lib/types/product"

export async function getProducts(): Promise<{ success: boolean; data?: ProductWithCategory[]; error?: string }> {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: "desc" },
            include: { category: true }
        })

        // Serialize Decimal fields to numbers for client components
        const serializedProducts = products.map(product => ({
            ...product,
            price: Number(product.price),
            cost: product.cost ? Number(product.cost) : null,
            preparationTime: product.preparationTime ? Number(product.preparationTime) : null,
        }))

        return { success: true, data: serializedProducts }
    } catch (error) {
        return { success: false, error: "Error al obtener productos" }
    }
}

export async function createProduct(data: ProductInput) {
    try {
        const validated = productSchema.parse(data)

        await prisma.product.create({
            data: validated
        })

        revalidatePath("/dashboard/menu/dishes")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al crear el producto" }
    }
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
    try {
        const validated = productSchema.partial().parse(data)

        await prisma.product.update({
            where: { id },
            data: validated
        })

        revalidatePath("/dashboard/menu/dishes")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al actualizar el producto" }
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id }
        })
        revalidatePath("/dashboard/menu/dishes")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al eliminar el producto" }
    }
}

export async function toggleProductAvailability(id: string, available: boolean) {
    try {
        await prisma.product.update({
            where: { id },
            data: { available }
        })
        revalidatePath("/dashboard/menu/dishes")
        return { success: true }
    } catch (error) {
        return { success: false, error: "Error al actualizar estado del producto" }
    }
}
