"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { CategoryActions } from "./category-actions"
import { createSortableHeader } from "@/lib/table-utils"
import { type Category } from "@prisma/client"

// Extend Category to include the count of products
type CategoryWithCount = Category & {
    _count: {
        products: number
    }
}

export const columns: ColumnDef<CategoryWithCount>[] = [
    {
        accessorKey: "image",
        header: "Imagen",
        cell: ({ row }) => {
            const image = row.getValue("image") as string
            const name = row.getValue("name") as string
            return (
                <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted">
                    {image ? (
                        <Image
                            src={image}
                            alt={name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                            Sin img
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
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("slug")}</div>,
    },
    {
        accessorKey: "active",
        header: createSortableHeader("Estado"),
        cell: ({ row }) => {
            const active = row.getValue("active") as boolean
            return (
                <Badge variant={active ? "default" : "secondary"}>
                    {active ? "Activo" : "Inactivo"}
                </Badge>
            )
        },
    },
    {
        accessorKey: "_count.products",
        header: createSortableHeader("Productos"),
        cell: ({ row }) => {
            return <div>{row.original._count.products}</div>
        },
    },
    {
        id: "actions",
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row }) => {
            return (
                <div className="text-right">
                    <CategoryActions category={row.original} />
                </div>
            )
        },
        enableSorting: false,
        enableHiding: false,
    },
]
