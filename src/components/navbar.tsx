import ThemeSelector from "@/components/theme-selector";
import { QuickActionsBar } from "@/components/navbar/quick-actions-bar";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function Navbar() {
  const session = await auth();
  let categories: any[] = [];
  let products: any[] = [];

  // Fetch categories and products for NewOrderDialog
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
      ]);

      // Serialize Decimal fields to numbers for client components
      categories = rawCategories;
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
      }));
    } catch (error) {
      console.error("Error fetching data for navbar:", error);
    }
  }

  return (
    <nav className="border-b bg-background">
      <header className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center px-4">
          <div className="ml-auto flex items-center gap-4">
            <QuickActionsBar categories={categories} products={products} />
            <ThemeSelector />
          </div>
        </div>
      </header>
    </nav>
  );
}
