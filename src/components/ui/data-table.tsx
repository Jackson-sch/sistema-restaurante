"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SearchInput } from "../search-input"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    searchPlaceholder?: string
    filterComponent?: React.ReactNode
    searchValue?: string
    onSearchChange?: (value: string) => void
    // Server-side pagination props
    pageCount?: number
    currentPage?: number
    onPageChange?: (page: number) => void
    onPageSizeChange?: (pageSize: number) => void
    // Server-side sorting props
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Buscar...",
    filterComponent,
    searchValue,
    onSearchChange,
    pageCount,
    currentPage,
    onPageChange,
    onPageSizeChange,
    sortBy,
    sortOrder,
    onSortChange,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>(
        sortBy && sortOrder ? [{ id: sortBy, desc: sortOrder === 'desc' }] : []
    )
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [globalFilter, setGlobalFilter] = React.useState("")

    // Determine if we're using server-side pagination/sorting
    const isServerSide = pageCount !== undefined && currentPage !== undefined
    const isServerSideSorting = onSortChange !== undefined

    // Handle sorting changes
    const handleSortingChange = React.useCallback((updater: any) => {
        if (isServerSideSorting) {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater
            setSorting(newSorting)

            if (newSorting.length > 0) {
                const sort = newSorting[0]
                onSortChange(sort.id, sort.desc ? 'desc' : 'asc')
            }
        } else {
            setSorting(updater)
        }
    }, [isServerSideSorting, onSortChange, sorting])

    const table = useReactTable({
        data,
        columns,
        onSortingChange: handleSortingChange,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: isServerSide ? undefined : getPaginationRowModel(),
        getSortedRowModel: isServerSideSorting ? undefined : getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: "includesString",
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter: searchValue !== undefined ? searchValue : globalFilter,
            ...(isServerSide && {
                pagination: {
                    pageIndex: currentPage - 1,
                    pageSize: 10,
                },
            }),
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
        manualFiltering: searchValue !== undefined,
        manualPagination: isServerSide,
        manualSorting: isServerSideSorting,
        pageCount: isServerSide ? pageCount : undefined,
    })

    return (
        <div className="w-full space-y-4">
            {/* Filters and Search */}
            <div className="flex items-center gap-4">
                <SearchInput
                    value={searchValue !== undefined ? searchValue : (globalFilter ?? "")}
                    onChange={onSearchChange || setGlobalFilter}
                    placeholder={searchPlaceholder}
                    className="max-w-sm"
                />
                {filterComponent}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            Columnas <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No se encontraron resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground">
                    {isServerSide
                        ? `${data.length} resultado(s) encontrado(s)`
                        : `${table.getFilteredRowModel().rows.length} resultado(s) encontrado(s)`
                    }
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Filas por página</p>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => {
                                const newPageSize = Number(value)
                                if (isServerSide && onPageSizeChange) {
                                    onPageSizeChange(newPageSize)
                                } else {
                                    table.setPageSize(newPageSize)
                                }
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Página {table.getState().pagination.pageIndex + 1} de{" "}
                        {isServerSide ? pageCount : table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                                if (isServerSide && onPageChange) {
                                    onPageChange(1)
                                } else {
                                    table.setPageIndex(0)
                                }
                            }}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Ir a la primera página</span>
                            {"<<"}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                                if (isServerSide && onPageChange) {
                                    onPageChange(currentPage! - 1)
                                } else {
                                    table.previousPage()
                                }
                            }}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Ir a la página anterior</span>
                            {"<"}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                                if (isServerSide && onPageChange) {
                                    onPageChange(currentPage! + 1)
                                } else {
                                    table.nextPage()
                                }
                            }}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Ir a la página siguiente</span>
                            {">"}
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                                if (isServerSide && onPageChange) {
                                    onPageChange(pageCount!)
                                } else {
                                    table.setPageIndex(table.getPageCount() - 1)
                                }
                            }}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Ir a la última página</span>
                            {">>"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
