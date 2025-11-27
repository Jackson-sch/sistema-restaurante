import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getIngredients } from "@/actions/inventory"
import { IngredientsTable } from "@/components/inventory/ingredients-table"
import { verifyPermissionOrRedirect } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/lib/permissions"

export default async function InventoryPage() {
  await verifyPermissionOrRedirect(PERMISSIONS.INVENTORY_VIEW)
  const result = await getIngredients()
  const ingredients = result.success && result.data ? result.data : []

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
      </div>
      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <IngredientsTable data={ingredients} />
      </div>
    </div>
  )
}
