"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

// ==========================================
// INGREDIENTS CRUD
// ==========================================

export async function getIngredients() {
  await requirePermission(PERMISSIONS.INVENTORY_VIEW)

  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No se encontró el restaurante" }
  }

  try {
    const ingredients = await prisma.ingredient.findMany({
      where: {
        restaurantId: session.user.restaurantId,
      },
      orderBy: {
        name: "asc",
      },
    })

    const serializedIngredients = ingredients.map(ingredient => ({
      ...ingredient,
      currentStock: Number(ingredient.currentStock),
      minStock: Number(ingredient.minStock),
      cost: Number(ingredient.cost),
    }))

    return { success: true, data: serializedIngredients }
  } catch (error) {
    console.error("Error fetching ingredients:", error)
    return { success: false, error: "Error al obtener ingredientes" }
  }
}

export async function createIngredient(data: {
  name: string
  unit: string
  minStock: number
  cost: number
  currentStock?: number
}) {
  await requirePermission(PERMISSIONS.INVENTORY_CREATE)

  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No se encontró el restaurante" }
  }

  try {
    const ingredient = await prisma.ingredient.create({
      data: {
        restaurantId: session.user.restaurantId,
        name: data.name,
        unit: data.unit,
        minStock: data.minStock,
        cost: data.cost,
        currentStock: data.currentStock || 0,
      },
    })

    // If initial stock is provided, record a movement
    if (data.currentStock && data.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          ingredientId: ingredient.id,
          type: "IN",
          quantity: data.currentStock,
          reason: "Inventario Inicial",
        },
      })
    }

    revalidatePath("/dashboard/inventory")
    return {
      success: true,
      data: {
        ...ingredient,
        currentStock: Number(ingredient.currentStock),
        minStock: Number(ingredient.minStock),
        cost: Number(ingredient.cost),
      }
    }
  } catch (error) {
    console.error("Error creating ingredient:", error)
    return { success: false, error: "Error al crear ingrediente" }
  }
}

export async function updateIngredient(id: string, data: {
  name: string
  unit: string
  minStock: number
  cost: number
}) {
  await requirePermission(PERMISSIONS.INVENTORY_UPDATE)

  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No se encontró el restaurante" }
  }

  try {
    const ingredient = await prisma.ingredient.update({
      where: {
        id,
        restaurantId: session.user.restaurantId,
      },
      data: {
        name: data.name,
        unit: data.unit,
        minStock: data.minStock,
        cost: data.cost,
      },
    })

    revalidatePath("/dashboard/inventory")
    return {
      success: true,
      data: {
        ...ingredient,
        currentStock: Number(ingredient.currentStock),
        minStock: Number(ingredient.minStock),
        cost: Number(ingredient.cost),
      }
    }
  } catch (error) {
    console.error("Error updating ingredient:", error)
    return { success: false, error: "Error al actualizar ingrediente" }
  }
}

export async function deleteIngredient(id: string) {
  await requirePermission(PERMISSIONS.INVENTORY_DELETE)

  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No se encontró el restaurante" }
  }

  try {
    await prisma.ingredient.delete({
      where: {
        id,
        restaurantId: session.user.restaurantId,
      },
    })

    revalidatePath("/dashboard/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error deleting ingredient:", error)
    return { success: false, error: "Error al eliminar ingrediente" }
  }
}

// ==========================================
// STOCK ADJUSTMENTS
// ==========================================

export async function adjustStock(ingredientId: string, quantity: number, type: "IN" | "OUT" | "WASTE" | "ADJUSTMENT", reason?: string) {
  await requirePermission(PERMISSIONS.INVENTORY_ADJUST)

  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No se encontró el restaurante" }
  }

  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId, restaurantId: session.user.restaurantId },
    })

    if (!ingredient) {
      return { success: false, error: "Ingrediente no encontrado" }
    }

    const newStock = type === "IN"
      ? Number(ingredient.currentStock) + quantity
      : Number(ingredient.currentStock) - quantity

    if (newStock < 0) {
      return { success: false, error: "El stock no puede ser negativo" }
    }

    // Transaction to update stock and record movement
    await prisma.$transaction([
      prisma.ingredient.update({
        where: { id: ingredientId },
        data: { currentStock: newStock },
      }),
      prisma.stockMovement.create({
        data: {
          ingredientId,
          type,
          quantity,
          reason,
        },
      }),
    ])

    revalidatePath("/dashboard/inventory")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al ajustar stock" }
  }
}

// ==========================================
// RECIPE MANAGEMENT
// ==========================================

export async function getRecipe(productId: string) {
  await requirePermission(PERMISSIONS.INVENTORY_VIEW)

  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No se encontró el restaurante" }
  }

  try {
    const recipe = await prisma.productIngredient.findMany({
      where: {
        productId,
        product: {
          category: {
            restaurantId: session.user.restaurantId
          }
        }
      },
      include: {
        ingredient: true
      }
    })

    const serializedRecipe = recipe.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      ingredient: {
        ...item.ingredient,
        currentStock: Number(item.ingredient.currentStock),
        minStock: Number(item.ingredient.minStock),
        cost: Number(item.ingredient.cost),
      },
      variantId: item.variantId, // Include variantId
    }))

    return { success: true, data: serializedRecipe }
  } catch (error) {
    console.error("Error fetching recipe:", error)
    return { success: false, error: "Error al obtener receta" }
  }
}

export async function updateRecipe(productId: string, ingredients: { ingredientId: string; quantity: number; variantId?: string | null }[]) {
  await requirePermission(PERMISSIONS.INVENTORY_UPDATE)

  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No se encontró el restaurante" }
  }

  try {
    // Verify product belongs to restaurant
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true }
    })

    if (!product || product.category.restaurantId !== session.user.restaurantId) {
      return { success: false, error: "Producto no encontrado o no autorizado" }
    }

    // Transaction: Delete existing and create new
    await prisma.$transaction(async (tx) => {
      await tx.productIngredient.deleteMany({
        where: { productId }
      })

      if (ingredients.length > 0) {
        await tx.productIngredient.createMany({
          data: ingredients.map(item => ({
            productId,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            variantId: item.variantId || null,
          }))
        })
      }
    })

    revalidatePath("/dashboard/inventory")
    return { success: true }
  } catch (error) {
    console.error("Error updating recipe:", error)
    return { success: false, error: "Error al actualizar receta" }
  }
}

// ==========================================
// AUTOMATIC STOCK DEDUCTION
// ==========================================

export async function deductStockForOrder(orderId: string) {
  // Internal action, permission check might be skipped if called from another server action
  // But good to have if called directly.
  // However, since this is called by updateOrderStatus which already checks permissions, 
  // we might just need to ensure we have the session context.

  const session = await auth()
  if (!session?.user?.restaurantId) {
    return { success: false, error: "No se encontró el restaurante" }
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                ingredients: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return { success: false, error: "Pedido no encontrado" }
    }

    // Calculate total deduction for each ingredient
    const ingredientDeductions = new Map<string, number>()

    for (const item of order.items) {
      // Filter ingredients:
      // 1. Global ingredients (variantId is null)
      // 2. Variant-specific ingredients (variantId matches item.variantId)
      const applicableIngredients = item.product.ingredients.filter(
        (ri) => !ri.variantId || ri.variantId === item.variantId
      )

      for (const recipeItem of applicableIngredients) {
        const totalQuantity = item.quantity * Number(recipeItem.quantity)
        const current = ingredientDeductions.get(recipeItem.ingredientId) || 0
        ingredientDeductions.set(recipeItem.ingredientId, current + totalQuantity)
      }
    }

    if (ingredientDeductions.size === 0) {
      return { success: true, message: "No hay ingredientes para descontar" }
    }

    // Execute deductions in a transaction
    await prisma.$transaction(async (tx) => {
      for (const [ingredientId, quantity] of ingredientDeductions.entries()) {
        // 1. Get current stock
        const ingredient = await tx.ingredient.findUnique({
          where: { id: ingredientId }
        })

        if (!ingredient) continue

        // 2. Update stock (allow negative)
        await tx.ingredient.update({
          where: { id: ingredientId },
          data: {
            currentStock: {
              decrement: quantity
            }
          }
        })

        // 3. Record movement
        await tx.stockMovement.create({
          data: {
            ingredientId,
            type: "OUT",
            quantity,
            reason: `Venta Orden #${order.orderNumber}`,
            reference: orderId
          }
        })
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error deducting stock:", error)
    return { success: false, error: "Error al descontar stock" }
  }
}
