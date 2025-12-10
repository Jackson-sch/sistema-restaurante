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
    // Row click handler
    onRowClick?: (row: TData) => void
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
    onRowClick,
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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <SearchInput
                    value={searchValue !== undefined ? searchValue : (globalFilter ?? "")}
                    onChange={onSearchChange || setGlobalFilter}
                    placeholder={searchPlaceholder}
                    className="w-full md:max-w-sm"
                />
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex-1 md:flex-none">
                        {filterComponent}
                    </div>
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
                                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined}
                                    onClick={() => onRowClick?.(row.original)}
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-2">
                <div className="text-xs sm:text-sm text-muted-foreground">
                    {isServerSide
                        ? `${data.length} resultado(s)`
                        : `${table.getFilteredRowModel().rows.length} resultado(s)`
                    }
                </div>
                <div className="flex flex-row items-center gap-2 sm:gap-4 lg:gap-6">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <p className="text-xs sm:text-sm font-medium whitespace-nowrap">
                            <span className="hidden sm:inline">Filas por página</span>
                            <span className="sm:hidden">Filas</span>
                        </p>
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
                            <SelectTrigger className="h-7 sm:h-8 w-[60px] sm:w-[70px]">
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
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center text-xs sm:text-sm font-medium whitespace-nowrap">
                            {table.getState().pagination.pageIndex + 1}/{isServerSide ? pageCount : table.getPageCount()}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="hidden sm:flex h-8 w-8 p-0"
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
                                className="hidden sm:flex h-8 w-8 p-0"
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
        </div>
    )
}
