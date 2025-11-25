"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { ProductActions } from "./product-actions"
import { createSortableHeader, formatCurrency } from "@/lib/table-utils"
import { type Category } from "@prisma/client"
import { type ProductWithCategory } from "@/lib/types/product"

export function createProductColumns(categories: Category[]): ColumnDef<ProductWithCategory>[] {
  return [
    {
      accessorKey: "image",
      header: "Imagen",
      cell: ({ row }) => {
        const image = row.getValue("image") as string
        const name = row.getValue("name") as string
        return (
          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
            {image ? (
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                Sin imagen
              </div>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: createSortableHeader("Nombre"),
      cell: ({ row }) => {
        const name = row.getValue("name") as string
        const description = row.original.description
        return (
          <div>
            <p className="font-medium">{name}</p>
            {description && (
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {description}
              </p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "category",
      header: createSortableHeader("Categoría"),
      cell: ({ row }) => {
        const category = row.original.category
        return <span>{category.name}</span>
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.original.category.id === value
      },
    },
    {
      accessorKey: "price",
      header: createSortableHeader("Precio"),
      cell: ({ row }) => {
        const price = row.getValue("price") as number
        return <span>{formatCurrency(price)}</span>
      },
    },
    {
      accessorKey: "available",
      header: createSortableHeader("Estado"),
      cell: ({ row }) => {
        const available = row.getValue("available") as boolean
        return (
          <Badge variant={available ? "default" : "secondary"}>
            {available ? "Disponible" : "Agotado"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <ProductActions
              product={row.original}
              categories={categories}
            />
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
