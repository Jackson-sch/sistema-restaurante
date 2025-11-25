import { getCategories } from "@/actions/categories"
import { CategoriesDataTable } from "@/components/menu/categories-data-table"
import { CategoryDialog } from "@/components/menu/category-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CategoriesPage() {
    const { data: categories } = await getCategories()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Categorías</h1>
                <CategoryDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listado de Categorías</CardTitle>
                </CardHeader>
                <CardContent>
                    <CategoriesDataTable data={categories || []} />
                </CardContent>
            </Card>
        </div>
    )
}
