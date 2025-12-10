"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ComboWithProducts } from "./combos-client"
import { formatCurrency } from "@/lib/utils"

interface ColumnsProps {
  onEdit: (combo: ComboWithProducts) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, currentStatus: boolean) => void
}

export const columns = ({ onEdit, onDelete, onToggleActive }: ColumnsProps): ColumnDef<ComboWithProducts>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "products",
    header: "Contenido",
    cell: ({ row }) => {
      const products = row.original.products
      return (
        <div className="flex flex-col gap-1">
          {products.map((p, i) => (
            <span key={i} className="text-xs text-muted-foreground">
              {p.quantity}x {p.product.name}
            </span>
          ))}
        </div>
      )
    }
  },
  {
    accessorKey: "price",
    header: "Precio",
    cell: ({ row }) => formatCurrency(row.original.price),
  },
  {
    accessorKey: "active",
    header: "Estado",
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Switch
          checked={row.original.active}
          onCheckedChange={() => onToggleActive(row.original.id, row.original.active)}
        />
        <Badge variant={row.original.active ? "default" : "secondary"}>
          {row.original.active ? "Activo" : "Inactivo"}
        </Badge>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const combo = row.original

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
            <DropdownMenuItem onClick={() => onEdit(combo)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(combo.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
