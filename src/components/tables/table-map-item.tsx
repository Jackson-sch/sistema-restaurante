"use client"

import { Table, Zone } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, User, QrCode, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface TableMapItemProps {
  table: Table & {
    zone?: Zone | null
    orders?: Array<{
      id: string
      createdAt: Date
      status: string
      user?: {
        name: string | null
      } | null
    }>
  }
  onClick?: () => void
}

const statusConfig = {
  AVAILABLE: {
    label: "Disponible",
    bgGradient: "from-slate-50/30 via-zinc-50/20 to-slate-50/30 dark:from-slate-900/20 dark:via-zinc-900/10 dark:to-slate-900/20",
    borderClass: "border-slate-200/40 dark:border-slate-700/40",
    iconClass: "text-slate-600 dark:text-slate-300",
    badgeClass: "bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300",
    glowColor: "shadow-slate-200/20 dark:shadow-slate-800/20",
  },
  OCCUPIED: {
    label: "Ocupada",
    bgGradient: "from-blue-50/30 via-indigo-50/20 to-blue-50/30 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-blue-900/20",
    borderClass: "border-blue-200/40 dark:border-blue-700/40",
    iconClass: "text-blue-600 dark:text-blue-300",
    badgeClass: "bg-blue-100/80 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300",
    glowColor: "shadow-blue-200/20 dark:shadow-blue-800/20",
  },
  RESERVED: {
    label: "Reservada",
    bgGradient: "from-teal-50/30 via-cyan-50/20 to-teal-50/30 dark:from-teal-900/20 dark:via-cyan-900/10 dark:to-teal-900/20",
    borderClass: "border-teal-200/40 dark:border-teal-700/40",
    iconClass: "text-teal-600 dark:text-teal-300",
    badgeClass: "bg-teal-100/80 dark:bg-teal-800/60 text-teal-600 dark:text-teal-300",
    glowColor: "shadow-teal-200/20 dark:shadow-teal-800/20",
  },
}

export function TableMapItem({ table, onClick }: TableMapItemProps) {
  // Get active orders (not completed or cancelled)
  const activeOrders = table.orders?.filter(
    (order) => !["COMPLETED", "CANCELLED"].includes(order.status)
  ) || []

  const oldestActiveOrder = activeOrders.length > 0
    ? activeOrders.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    )
    : null

  const config = statusConfig[table.status as keyof typeof statusConfig]

  // Calculate occupation duration
  const getOccupationDuration = () => {
    if (!oldestActiveOrder) return null

    const now = new Date()
    const orderDate = new Date(oldestActiveOrder.createdAt)
    const diffMs = now.getTime() - orderDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `${diffMins}m`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Get urgency class for long occupations
  const getUrgencyClass = () => {
    if (!oldestActiveOrder) return ""

    const now = new Date()
    const orderDate = new Date(oldestActiveOrder.createdAt)
    const diffMins = Math.floor((now.getTime() - orderDate.getTime()) / 60000)

    if (diffMins > 120) return "border-orange-400/40 shadow-orange-400/10" // > 2 hours
    if (diffMins > 60) return "border-amber-400/40 shadow-amber-400/10" // > 1 hour
    return ""
  }

  const duration = getOccupationDuration()
  const urgencyClass = getUrgencyClass()
  const assignedWaiter = activeOrders[0]?.user?.name

  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-105",
        "bg-gradient-to-b backdrop-blur-sm",
        config.bgGradient,
        "border",
        urgencyClass || config.borderClass,
        "shadow-lg hover:shadow-xl",
        config.glowColor,
        table.status === "AVAILABLE" && "hover:border-slate-300 dark:hover:border-slate-600"
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: Table Number and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {table.number}
            </span>
            {table.qrCode && (
              <QrCode className={cn("w-4 h-4", config.iconClass)} />
            )}
          </div>
          <Badge className={cn("text-xs font-semibold", config.badgeClass)}>
            {config.label}
          </Badge>
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-2">
          <Users className={cn("w-4 h-4", config.iconClass)} />
          <span className="text-sm font-medium text-muted-foreground">
            {table.capacity} {table.capacity === 1 ? "persona" : "personas"}
          </span>
        </div>

        {/* Occupation Duration (if occupied) */}
        {table.status === "OCCUPIED" && duration && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Clock className={cn("w-4 h-4", config.iconClass)} />
            <span className={cn("text-sm font-semibold", config.iconClass)}>
              {duration}
            </span>
            {assignedWaiter && (
              <span className="text-xs text-muted-foreground ml-auto truncate">
                {assignedWaiter}
              </span>
            )}
          </div>
        )}

        {/* Reserved indicator */}
        {table.status === "RESERVED" && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Calendar className={cn("w-4 h-4", config.iconClass)} />
            <span className={cn("text-sm font-semibold", config.iconClass)}>
              Reservada
            </span>
          </div>
        )}

        {/* Active Orders Count (if occupied) */}
        {table.status === "OCCUPIED" && activeOrders.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {activeOrders.length} {activeOrders.length === 1 ? "pedido" : "pedidos"}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
