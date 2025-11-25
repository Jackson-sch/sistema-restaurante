"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createSortableHeader } from "@/lib/table-utils"

export type Payment = {
  id: string
  amount: number
  method: string
  receiptType: string | null
  receiptNumber: string | null
  createdAt: Date
  order: {
    orderNumber: string
    table: {
      number: string
    } | null
  }
  cashier: {
    name: string
  } | null
}

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    YAPE: 'Yape',
    PLIN: 'Plin',
    TRANSFER: 'Transferencia',
    MIXED: 'Mixto',
  }
  return labels[method] || method
}

export const createPaymentColumns = (
  onReprint: (paymentId: string) => void
): ColumnDef<Payment>[] => [
    {
      accessorKey: "order.orderNumber",
      header: createSortableHeader("N° Orden"),
      cell: ({ row }) => {
        return (
          <div className="font-medium">
            {row.original.order.orderNumber}
          </div>
        )
      },
    },
    {
      accessorKey: "order.table.number",
      header: createSortableHeader("Mesa"),
      cell: ({ row }) => {
        const table = row.original.order.table
        return table ? (
          <div className="text-sm">
            Mesa {table.number}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: createSortableHeader("Fecha"),
      cell: ({ row }) => {
        return (
          <div className="text-sm">
            {format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.original.createdAt).getTime()
        const dateB = new Date(rowB.original.createdAt).getTime()
        return dateA - dateB
      },
    },
    {
      accessorKey: "method",
      header: createSortableHeader("Método"),
      cell: ({ row }) => {
        return (
          <div className="text-sm">
            {getPaymentMethodLabel(row.original.method)}
          </div>
        )
      },
    },
    {
      accessorKey: "amount",
      header: createSortableHeader("Monto"),
      cell: ({ row }) => {
        return (
          <div className="font-semibold">
            S/ {row.original.amount.toFixed(2)}
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        return rowA.original.amount - rowB.original.amount
      },
    },
    {
      accessorKey: "receiptType",
      header: createSortableHeader("Comprobante"),
      cell: ({ row }) => {
        const { receiptType, receiptNumber } = row.original
        return receiptType ? (
          <div className="text-sm">
            <div className="font-medium">{receiptType}</div>
            {receiptNumber && (
              <div className="text-muted-foreground">{receiptNumber}</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )
      },
    },
    {
      accessorKey: "cashier.name",
      header: createSortableHeader("Cajero"),
      cell: ({ row }) => {
        const cashier = row.original.cashier
        return cashier ? (
          <div className="text-sm">{cashier.name}</div>
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const payment = row.original

        if (!payment.receiptType) {
          return null
        }

        return (
          <div className="text-right">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReprint(payment.id)}
            >
              <Printer className="h-4 w-4 mr-2" />
              Reimprimir
            </Button>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
