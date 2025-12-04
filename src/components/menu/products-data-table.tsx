"use client"

import * as React from "react"
import { DataTable } from "@/components/ui/data-table"
import { createProductColumns } from "./product-columns"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { type Category } from "@prisma/client"
import { type ProductWithCategory } from "@/lib/types/product"

interface ProductsDataTableProps {
    data: ProductWithCategory[]
    categories: Category[]
}

export function ProductsDataTable({ data, categories }: ProductsDataTableProps) {
    const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
    const columns = createProductColumns(categories)

    // Filter component for category selection
    const filterComponent = (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent position="popper" className="w-full" sideOffset={5}>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                            {category.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
    )

    // Filter data by category
    const filteredData = React.useMemo(() => {
        if (categoryFilter === "all") return data
        return data.filter((product) => product.category.id === categoryFilter)
    }, [data, categoryFilter])

    return (
        <DataTable
            columns={columns}
            data={filteredData}
            searchPlaceholder="Buscar productos..."
            filterComponent={filterComponent}
        />
    )
}
