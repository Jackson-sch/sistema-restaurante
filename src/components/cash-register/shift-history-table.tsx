"use client"

import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"

interface ShiftHistoryTableProps {
    data: any[]
}

export function ShiftHistoryTable({ data }: ShiftHistoryTableProps) {
    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "openedAt",
            header: "Apertura",
            cell: ({ row }) => {
                return format(new Date(row.getValue("openedAt")), "dd/MM/yyyy HH:mm", { locale: es })
            }
        },
        {
            accessorKey: "closedAt",
            header: "Cierre",
            cell: ({ row }) => {
                const date = row.getValue("closedAt")
                return date ? format(new Date(date as string), "dd/MM/yyyy HH:mm", { locale: es }) : "-"
            }
        },
        {
            accessorKey: "turn",
            header: "Turno",
            cell: ({ row }) => {
                const turn = row.getValue("turn") as string | null
                return turn ? <Badge variant="outline">{turn}</Badge> : "-"
            }
        },
        {
            accessorKey: "user.name",
            header: "Usuario",
        },
        {
            accessorKey: "openingCash",
            header: "Monto Inicial",
            cell: ({ row }) => formatCurrency(row.getValue("openingCash"))
        },
        {
            accessorKey: "closingCash",
            header: "Monto Final",
            cell: ({ row }) => {
                const val = row.getValue("closingCash")
                return val !== null ? formatCurrency(val as number) : "-"
            }
        },
        {
            accessorKey: "difference",
            header: "Diferencia",
            cell: ({ row }) => {
                const val = row.getValue("difference") as number | null
                if (val === null) return "-"

                return (
                    <span className={val < 0 ? "text-red-500 font-medium" : val > 0 ? "text-green-500 font-medium" : ""}>
                        {formatCurrency(val)}
                    </span>
                )
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
                return (
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/cash-register/${row.original.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                )
            }
        }
    ]

    return (
        <DataTable
            columns={columns}
            data={data}
            searchKey="user.name"
            searchPlaceholder="Buscar por usuario..."
        />
    )
}
