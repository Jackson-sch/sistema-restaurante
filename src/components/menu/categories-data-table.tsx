"use client"

import * as React from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./category-columns"
import { type Category } from "@prisma/client"

type CategoryWithCount = Category & {
    _count: {
        products: number
    }
}

interface CategoriesDataTableProps {
    data: CategoryWithCount[]
}

export function CategoriesDataTable({ data }: CategoriesDataTableProps) {
    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            searchPlaceholder="Buscar categorías..."
        />
    )
}
