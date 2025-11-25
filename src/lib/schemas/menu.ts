import { z } from "zod"

export const categorySchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    slug: z.string().min(1, "El slug es requerido").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug debe contener solo letras minúsculas, números y guiones"),
    image: z.string().optional(),
})

export type CategoryInput = z.infer<typeof categorySchema>

export const productSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
    price: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
    categoryId: z.string().min(1, "La categoría es requerida"),
    image: z.string().optional(),
    available: z.boolean().default(true),
    // Nuevos campos opcionales
    sku: z.string().optional(),
    cost: z.coerce.number().optional(),
    images: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    preparationTime: z.coerce.number().optional(),
    allergens: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
})

export type ProductInput = z.infer<typeof productSchema>

// Schemas for Variants and Modifiers

export const variantSchema = z.object({
    productId: z.string().min(1),
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
    sku: z.string().optional(),
    available: z.boolean().default(true),
})

export type VariantInput = z.infer<typeof variantSchema>

export const modifierGroupSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    required: z.boolean().default(false),
    multiSelect: z.boolean().default(true),
    minSelect: z.coerce.number().min(0).default(0),
    maxSelect: z.coerce.number().min(1).optional(),
})

export type ModifierGroupInput = z.infer<typeof modifierGroupSchema>

export const modifierSchema = z.object({
    modifierGroupId: z.string().min(1),
    name: z.string().min(1, "El nombre es requerido"),
    price: z.coerce.number().min(0).default(0),
    available: z.boolean().default(true),
})

export type ModifierInput = z.infer<typeof modifierSchema>
