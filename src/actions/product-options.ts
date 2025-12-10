"use server"

import { prisma } from "@/lib/prisma"
import {
  variantSchema,
  modifierGroupSchema,
  modifierSchema,
  type VariantInput,
  type ModifierGroupInput,
  type ModifierInput
} from "@/lib/schemas/menu"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

// Helper para manejar errores de Prisma
function handlePrismaError(error: unknown, defaultMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return "Ya existe un registro con estos datos"
    }
    if (error.code === 'P2025') {
      return "Registro no encontrado"
    }
  }
  console.error(defaultMessage, error)
  return defaultMessage
}

export async function getProductOptions(productId: string) {
  try {
    if (!productId) {
      return { success: false, error: "ID de producto inválido" }
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          orderBy: { price: 'asc' }
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: {
                  orderBy: { price: 'asc' }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!product) {
      return { success: false, error: "Producto no encontrado" }
    }

    return {
      success: true,
      data: {
        variants: product.variants.map(v => ({
          ...v,
          price: Number(v.price)
        })),
        modifierGroups: product.modifierGroups.map(pmg => ({
          ...pmg.modifierGroup,
          modifiers: pmg.modifierGroup.modifiers.map(m => ({
            ...m,
            price: Number(m.price)
          }))
        }))
      }
    }
  } catch (error) {
    return {
      success: false,
      error: handlePrismaError(error, "Error al obtener opciones")
    }
  }
}

// --- Variants ---

export async function createVariant(data: VariantInput) {
  try {
    const validated = variantSchema.parse(data)
    const variant = await prisma.productVariant.create({
      data: validated
    })
    // No llamar revalidatePath para evitar cerrar el dialog - se actualiza con onRefresh()
    return {
      success: true,
      data: { ...variant, price: Number(variant.price) }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: "Datos de variante inválidos" }
    }
    return {
      success: false,
      error: handlePrismaError(error, "Error al crear variante")
    }
  }
}

export async function updateVariant(id: string, data: Partial<VariantInput>) {
  try {
    if (!id) {
      return { success: false, error: "ID de variante inválido" }
    }

    const validated = variantSchema.partial().parse(data)
    const variant = await prisma.productVariant.update({
      where: { id },
      data: validated
    })
    // No llamar revalidatePath para evitar cerrar el dialog
    return {
      success: true,
      data: { ...variant, price: Number(variant.price) }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: "Datos de variante inválidos" }
    }
    return {
      success: false,
      error: handlePrismaError(error, "Error al actualizar variante")
    }
  }
}

export async function deleteVariant(id: string) {
  try {
    if (!id) {
      return { success: false, error: "ID de variante inválido" }
    }

    await prisma.productVariant.delete({ where: { id } })
    // No llamar revalidatePath para evitar cerrar el dialog
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: handlePrismaError(error, "Error al eliminar variante")
    }
  }
}

// --- Modifier Groups ---

export async function createModifierGroup(productId: string, data: ModifierGroupInput) {
  try {
    if (!productId) {
      return { success: false, error: "ID de producto inválido" }
    }

    const validated = modifierGroupSchema.parse(data)

    // Usar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.modifierGroup.create({
        data: validated
      })

      await tx.productModifierGroup.create({
        data: {
          productId,
          modifierGroupId: group.id
        }
      })

      return group
    })

    // No llamar revalidatePath para evitar cerrar el dialog
    return {
      success: true,
      data: { ...result, modifiers: [] }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: "Datos de grupo inválidos" }
    }
    return {
      success: false,
      error: handlePrismaError(error, "Error al crear grupo de modificadores")
    }
  }
}

export async function updateModifierGroup(id: string, data: Partial<ModifierGroupInput>) {
  try {
    if (!id) {
      return { success: false, error: "ID de grupo inválido" }
    }

    const validated = modifierGroupSchema.partial().parse(data)
    const group = await prisma.modifierGroup.update({
      where: { id },
      data: validated,
      include: { modifiers: true }
    })
    // No llamar revalidatePath para evitar cerrar el dialog
    return {
      success: true,
      data: {
        ...group,
        modifiers: group.modifiers.map(m => ({
          ...m,
          price: Number(m.price)
        }))
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: "Datos de grupo inválidos" }
    }
    return {
      success: false,
      error: handlePrismaError(error, "Error al actualizar grupo")
    }
  }
}

export async function deleteModifierGroup(productId: string, groupId: string) {
  try {
    if (!productId || !groupId) {
      return { success: false, error: "IDs inválidos" }
    }

    await prisma.productModifierGroup.delete({
      where: {
        productId_modifierGroupId: {
          productId,
          modifierGroupId: groupId
        }
      }
    })
    // No llamar revalidatePath para evitar cerrar el dialog
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: handlePrismaError(error, "Error al eliminar grupo")
    }
  }
}

// --- Modifiers ---

export async function createModifier(data: ModifierInput) {
  try {
    const validated = modifierSchema.parse(data)
    const modifier = await prisma.modifier.create({
      data: validated
    })
    // No llamar revalidatePath para evitar cerrar el dialog
    return {
      success: true,
      data: { ...modifier, price: Number(modifier.price) }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: "Datos de modificador inválidos" }
    }
    return {
      success: false,
      error: handlePrismaError(error, "Error al crear modificador")
    }
  }
}

export async function updateModifier(id: string, data: Partial<ModifierInput>) {
  try {
    if (!id) {
      return { success: false, error: "ID de modificador inválido" }
    }

    const validated = modifierSchema.partial().parse(data)
    const modifier = await prisma.modifier.update({
      where: { id },
      data: validated
    })
    // No llamar revalidatePath para evitar cerrar el dialog
    return {
      success: true,
      data: { ...modifier, price: Number(modifier.price) }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return { success: false, error: "Datos de modificador inválidos" }
    }
    return {
      success: false,
      error: handlePrismaError(error, "Error al actualizar modificador")
    }
  }
}

export async function deleteModifier(id: string) {
  try {
    if (!id) {
      return { success: false, error: "ID de modificador inválido" }
    }

    await prisma.modifier.delete({ where: { id } })
    // No llamar revalidatePath para evitar cerrar el dialog
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: handlePrismaError(error, "Error al eliminar modificador")
    }
  }
}