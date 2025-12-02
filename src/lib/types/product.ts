import { type Category, type Product, Prisma } from "@prisma/client"

// Type for server-side data before transformation (with Decimals)
export type ProductWithRelations = Prisma.ProductGetPayload<{
    include: {
        category: true
        variants: true
        modifierGroups: {
            include: {
                modifierGroup: {
                    include: {
                        modifiers: true
                    }
                }
            }
        }
    }
}>

// Type for client-side data (with numbers instead of Decimals)
export type ProductWithCategory = Omit<Product, "price" | "cost" | "preparationTime"> & {
    price: number
    cost: number | null
    preparationTime: number | null
    category: Category
}
