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
import { getProductsPaginated } from "@/actions/products"

interface ProductsDataTableProps {
    categories: Category[]
    initialData?: ProductWithCategory[]
    initialMeta?: { total: number; page: number; limit: number; totalPages: number }
}

export function ProductsDataTable({ categories, initialData, initialMeta }: ProductsDataTableProps) {
    const [products, setProducts] = React.useState<ProductWithCategory[]>(initialData || [])
    const [loading, setLoading] = React.useState(!initialData)
    const [page, setPage] = React.useState(initialMeta?.page || 1)
    const [pageSize, setPageSize] = React.useState(initialMeta?.limit || 10)
    const [totalPages, setTotalPages] = React.useState(initialMeta?.totalPages || 1)
    const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
    const [searchValue, setSearchValue] = React.useState("")

    const columns = createProductColumns(categories)

    const loadProducts = React.useCallback(async () => {
        setLoading(true)
        const result = await getProductsPaginated({
            page,
            limit: pageSize,
            search: searchValue || undefined,
            categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        })
        if (result.success && result.data) {
            setProducts(result.data as ProductWithCategory[])
            setTotalPages(result.meta.totalPages)
        }
        setLoading(false)
    }, [page, pageSize, searchValue, categoryFilter])

    React.useEffect(() => {
        loadProducts()
    }, [loadProducts])

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setPage(1)
    }, [categoryFilter])

    // Debounce search
    const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const handleSearchChange = (value: string) => {
        setSearchValue(value)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }
        searchTimeoutRef.current = setTimeout(() => {
            setPage(1)
        }, 300)
    }

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

    return (
        <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Buscar productos..."
            filterComponent={filterComponent}
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
            pageCount={totalPages}
            currentPage={page}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(1)
            }}
        />
    )
}
