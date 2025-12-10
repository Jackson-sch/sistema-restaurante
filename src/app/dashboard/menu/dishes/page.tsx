import { getCategories } from "@/actions/categories"
import { ProductDialog } from "@/components/menu/product-dialog"
import { ProductsDataTable } from "@/components/menu/products-data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ProductsPage() {
    const { data: categories } = await getCategories()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Platos y Bebidas</h1>
                <ProductDialog categories={categories || []} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Productos</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProductsDataTable
                        categories={categories || []}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
