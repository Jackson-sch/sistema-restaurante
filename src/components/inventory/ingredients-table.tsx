"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Search, AlertTriangle, ArrowRightLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  currentStock: any // Decimal
  minStock: any // Decimal
  cost: any // Decimal
}

interface IngredientsTableProps {
  data: Ingredient[]
}

export function IngredientsTable({ data }: IngredientsTableProps) {
  const [filter, setFilter] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [adjustingIngredient, setAdjustingIngredient] = useState<Ingredient | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  )

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ingrediente..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ingrediente
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="text-right">Stock Actual</TableHead>
              <TableHead className="text-right">Stock Mínimo</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron ingredientes.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const stock = Number(item.currentStock)
                const min = Number(item.minStock)
                const cost = Number(item.cost)
                const isLowStock = stock <= min

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.name}
                        {isLowStock && (
                          <Badge variant="destructive" className="h-5 px-1 text-[10px]">
                            Bajo Stock
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {stock} {item.unit}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {min} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      S/ {cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      S/ {(stock * cost).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setAdjustingIngredient(item)}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Ajustar Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingIngredient(item)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingId(item.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  )
}
