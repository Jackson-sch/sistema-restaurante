"use client"

import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns, type DiscountRow } from "@/components/discounts/columns"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Percent } from "lucide-react"
import { DiscountDialog } from "@/components/discounts/discount-dialog"
import { toggleDiscountActive, deleteDiscount } from "@/actions/discounts"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DiscountsClientProps {
  initialDiscounts: DiscountRow[]
}

export function DiscountsClient({ initialDiscounts }: DiscountsClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountRow | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleEdit = (discount: DiscountRow) => {
    setEditingDiscount(discount)
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (id: string) => {
    const result = await toggleDiscountActive(id)
    if (result.success) {
      toast.success("Estado actualizado")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteId(id)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return

    const result = await deleteDiscount(deleteId)
    if (result.success) {
      toast.success("Descuento eliminado")
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setDeleteId(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingDiscount(null)
  }

  const handleSuccess = () => {
    handleDialogClose()
    router.refresh()
  }

  // Create columns with handlers
  const columnsWithHandlers = columns.map(col => {
    if (col.id === "actions" || (col as any).accessorKey === "active") {
      return {
        ...col,
        cell: (props: any) => {
          const originalCell = col.cell as any
          return originalCell({
            ...props,
            table: {
              ...props.table,
              options: {
                ...props.table.options,
                meta: {
                  onEdit: handleEdit,
                  onToggleActive: handleToggleActive,
                  onDelete: handleDeleteClick,
                }
              }
            }
          })
        }
      }
    }
    return col
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Descuento
        </Button>
      </div>

      <DataTable
        columns={columnsWithHandlers as any}
        data={initialDiscounts}
        searchKey="code"
        searchPlaceholder="Buscar por código..."
      />

      <DiscountDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        discount={editingDiscount}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este descuento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El descuento será eliminado permanentemente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
