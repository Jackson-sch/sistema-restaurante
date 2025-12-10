"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Pencil, Trash2, Percent, DollarSign, Gift } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import type { Discount } from "@prisma/client"

// Serialized discount row (after JSON serialization, dates are strings)
export type DiscountRow = {
  id: string
  code: string
  name: string
  type: string
  value: number
  minOrderAmount: number | null
  maxDiscount: number | null
  usageLimit: number | null
  usageCount: number
  validFrom: string
  validUntil: string
  active: boolean
  applicableTo: string[]
  createdAt: string
  updatedAt: string
}

const typeConfig: Record<string, { label: string; icon: typeof Percent }> = {
  PERCENTAGE: { label: "Porcentaje", icon: Percent },
  FIXED_AMOUNT: { label: "Monto fijo", icon: DollarSign },
  FREE_ITEM: { label: "Item gratis", icon: Gift },
}

export const columns: ColumnDef<DiscountRow>[] = [
  {
    accessorKey: "code",
    header: "Código",
    cell: ({ row }) => (
      <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
        {row.getValue("code")}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      const config = typeConfig[type] || { label: type, icon: Percent }
      const Icon = config.icon
      const discount = row.original

      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>
            {type === "PERCENTAGE"
              ? `${discount.value}%`
              : type === "FIXED_AMOUNT"
                ? formatCurrency(discount.value)
                : config.label
            }
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "usageCount",
    header: "Usos",
    cell: ({ row }) => {
      const discount = row.original
      const limit = discount.usageLimit
      const count = discount.usageCount

      return (
        <span className="text-sm">
          {count}{limit ? ` / ${limit}` : ''}
        </span>
      )
    },
  },
  {
    accessorKey: "validUntil",
    header: "Validez",
    cell: ({ row }) => {
      const from = new Date(row.original.validFrom)
      const until = new Date(row.original.validUntil)
      const now = new Date()
      const isExpired = now > until
      const isNotStarted = now < from

      return (
        <div className="flex flex-col text-sm">
          <span className={isExpired ? "text-red-500" : isNotStarted ? "text-amber-500" : ""}>
            {format(from, "d MMM", { locale: es })} - {format(until, "d MMM yyyy", { locale: es })}
          </span>
          {isExpired && <span className="text-xs text-red-500">Expirado</span>}
          {isNotStarted && <span className="text-xs text-amber-500">Próximamente</span>}
        </div>
      )
    },
  },
  {
    accessorKey: "active",
    header: "Activo",
    cell: ({ row, table }) => {
      const meta = table.options.meta as any
      const discount = row.original

      return (
        <Switch
          checked={discount.active}
          onCheckedChange={() => meta?.onToggleActive?.(discount.id)}
        />
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const discount = row.original
      const meta = table.options.meta as any

      return (
        <TooltipProvider delayDuration={100}>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => meta?.onEdit?.(discount)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => meta?.onDelete?.(discount.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )
    },
  },
]
