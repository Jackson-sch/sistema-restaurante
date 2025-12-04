import { TablesView } from "@/components/tables/tables-view"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export default async function TablesPage() {
  const session = await auth()
  let categories: any[] = []
  let products: any[] = []

  // Fetch categories and products for quick order functionality
  if (session?.user?.restaurantId) {
    try {
      const [rawCategories, rawProducts] = await Promise.all([
        prisma.category.findMany({
          where: { restaurantId: session.user.restaurantId },
          orderBy: { name: 'asc' }
        }),
        prisma.product.findMany({
          where: {
            category: {
              restaurantId: session.user.restaurantId
            },
            available: true
          },
          include: {
            category: true,
            variants: true,
            modifierGroups: {
              include: {
                modifierGroup: {
                  include: {
                    modifiers: true
                  }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        })
      ])

      // Serialize Decimal fields
      categories = rawCategories
      products = rawProducts.map(product => ({
        ...product,
        price: Number(product.price),
        cost: product.cost ? Number(product.cost) : null,
        variants: product.variants.map(variant => ({
          ...variant,
          price: Number(variant.price)
        })),
        modifierGroups: product.modifierGroups.map(pmg => ({
          ...pmg,
          modifierGroup: {
            ...pmg.modifierGroup,
            modifiers: pmg.modifierGroup.modifiers.map(m => ({
              ...m,
              price: Number(m.price)
            }))
          }
        }))
      }))
    } catch (error) {
      console.error("Error fetching data for tables page:", error)
    }
  }

  return <TablesView categories={categories} products={products} />
}
