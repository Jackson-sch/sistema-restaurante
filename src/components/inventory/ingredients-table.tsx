"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, ArrowRightLeft, ArrowUpDown } from "lucide-react"
import { IngredientDialog } from "./ingredient-dialog"
import { StockAdjustmentDialog } from "./stock-adjustment-dialog"
import { deleteIngredient } from "@/actions/inventory"
import { toast } from "sonner"
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

interface Ingredient {
  id: string
  name: string
  unit: string
  currentStock: number
  minStock: number
  cost: number
}

interface IngredientsTableProps {
  data: Ingredient[]
}

export function IngredientsTable({ data }: IngredientsTableProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [adjustingIngredient, setAdjustingIngredient] = useState<Ingredient | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingId) return
    const result = await deleteIngredient(deletingId)
    if (result.success) {
      toast.success("Ingrediente eliminado")
    } else {
      toast.error(result.error)
    }
    setDeletingId(null)
  }

  // Column definitions
  const columns: ColumnDef<Ingredient>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stock = row.original.currentStock
        const min = row.original.minStock
        const isLowStock = stock <= min

        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.name}</span>
            {isLowStock && (
              <Badge variant="destructive" className="h-5 px-1 text-[10px]">
                Bajo Stock
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "currentStock",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Stock Actual
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-bold">
          {row.original.currentStock} {row.original.unit}
        </div>
      ),
    },
    {
      accessorKey: "minStock",
      header: () => <div className="text-right">Stock Mínimo</div>,
      cell: ({ row }) => (
        <div className="text-right text-muted-foreground">
          {row.original.minStock} {row.original.unit}
        </div>
      ),
    },
    {
      accessorKey: "cost",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Costo Unit.
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right">S/ {row.original.cost.toFixed(2)}</div>
      ),
    },
    {
      id: "totalValue",
      header: () => <div className="text-right">Valor Total</div>,
      cell: ({ row }) => {
        const value = row.original.currentStock * row.original.cost
        return <div className="text-right">S/ {value.toFixed(2)}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const ingredient = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setAdjustingIngredient(ingredient)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Ajustar Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditingIngredient(ingredient)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeletingId(ingredient.id)}
                className="text-red-600 focus:text-red-600"
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Filter component - New Ingredient button
  const filterComponent = (
    <Button onClick={() => setIsCreateOpen(true)} size="sm" className="w-full md:w-auto">
      <Plus className="mr-2 h-4 w-4" />
      <span className="hidden sm:inline">Nuevo Ingrediente</span>
      <span className="sm:hidden">Nuevo</span>
    </Button>
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Buscar ingrediente..."
        filterComponent={filterComponent}
      />

      <IngredientDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <IngredientDialog
        open={!!editingIngredient}
        onOpenChange={(open) => !open && setEditingIngredient(null)}
        ingredient={editingIngredient}
      />

      <StockAdjustmentDialog
        open={!!adjustingIngredient}
        onOpenChange={(open) => !open && setAdjustingIngredient(null)}
        ingredient={adjustingIngredient}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el ingrediente
              y todo su historial de movimientos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
