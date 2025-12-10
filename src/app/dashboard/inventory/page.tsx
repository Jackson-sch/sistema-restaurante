import { verifyPermissionOrRedirect } from "@/lib/auth-utils"
import { PERMISSIONS } from "@/lib/permissions"
import { IngredientsTable } from "@/components/inventory/ingredients-table"

export default async function InventoryPage() {
  await verifyPermissionOrRedirect(PERMISSIONS.INVENTORY_VIEW)

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
      </div>
      <div className="h-full flex-1 flex-col space-y-8">
        <IngredientsTable />
      </div>
    </div>
  )
}
