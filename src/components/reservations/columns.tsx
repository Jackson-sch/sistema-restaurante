"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Pencil, Trash2, Check, X, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Reservation, Table, Zone } from "@prisma/client"

export type ReservationWithTable = Reservation & {
  table: Table & {
    zone: Zone | null
  }
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  PENDING: { label: "Pendiente", variant: "secondary" },
  CONFIRMED: { label: "Confirmada", variant: "default" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
  COMPLETED: { label: "Completada", variant: "outline" },
  NO_SHOW: { label: "No asistió", variant: "destructive" },
}

export const columns: ColumnDef<ReservationWithTable>[] = [
  {
    accessorKey: "reservationNumber",
    header: "N° Reserva",
    cell: ({ row }) => (
      <span className="font-mono font-medium text-primary">
        {row.getValue("reservationNumber")}
      </span>
    ),
  },
  {
    accessorKey: "date",
    header: "Fecha y Hora",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"))
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {format(date, "d MMM yyyy", { locale: es })}
          </span>
          <span className="text-sm text-muted-foreground">
            {format(date, "HH:mm", { locale: es })} - {row.original.duration} min
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "table",
    header: "Mesa",
    cell: ({ row }) => {
      const table = row.original.table
      return (
        <div className="flex flex-col">
          <span className="font-medium">Mesa {table.number}</span>
          {table.zone && (
            <span className="text-sm text-muted-foreground">{table.zone.name}</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.getValue("customerName")}</span>
        <span className="text-sm text-muted-foreground">{row.original.customerPhone}</span>
      </div>
    ),
  },
  {
    accessorKey: "guests",
    header: "Personas",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("guests")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const config = statusConfig[status] || { label: status, variant: "outline" }
      return (
        <Badge variant={config.variant as any}>
          {config.label}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const reservation = row.original
      const meta = table.options.meta as any

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
            <DropdownMenuItem onClick={() => meta?.onEdit?.(reservation)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {reservation.status === "PENDING" && (
              <DropdownMenuItem onClick={() => meta?.onStatusChange?.(reservation.id, "CONFIRMED")}>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Confirmar
              </DropdownMenuItem>
            )}
            {(reservation.status === "PENDING" || reservation.status === "CONFIRMED") && (
              <>
                <DropdownMenuItem onClick={() => meta?.onStatusChange?.(reservation.id, "COMPLETED")}>
                  <Clock className="mr-2 h-4 w-4 text-blue-600" />
                  Marcar Completada
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => meta?.onStatusChange?.(reservation.id, "CANCELLED")}>
                  <X className="mr-2 h-4 w-4 text-red-600" />
                  Cancelar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => meta?.onStatusChange?.(reservation.id, "NO_SHOW")}>
                  <X className="mr-2 h-4 w-4 text-orange-600" />
                  No asistió
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => meta?.onDelete?.(reservation.id)}
              className="text-destructive focus:text-destructive"
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
