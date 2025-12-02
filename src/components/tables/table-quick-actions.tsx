"use client"

import { Table, Zone } from "@prisma/client"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { updateTableStatus } from "@/actions/tables"
import { toast } from "sonner"
import { useTransition } from "react"
import {
  Users,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  QrCode,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TableQuickActionsProps {
  table: (Table & {
    zone?: Zone | null
    orders?: Array<{
      id: string
      orderNumber?: string
      createdAt: Date
      status: string
      total?: number
      user?: {
        name: string | null
      } | null
    }>
  }) | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

const statusConfig = {
  AVAILABLE: {
    label: "Disponible",
    color: "bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/40",
    dot: "bg-slate-500",
    icon: CheckCircle2,
    iconColor: "text-slate-600",
  },
  OCCUPIED: {
    label: "Ocupada",
    color: "bg-blue-100/80 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300 border-blue-200/40",
    dot: "bg-blue-500",
    icon: XCircle,
    iconColor: "text-blue-600",
  },
  RESERVED: {
    label: "Reservada",
    color: "bg-teal-100/80 dark:bg-teal-800/60 text-teal-600 dark:text-teal-300 border-teal-200/40",
    dot: "bg-teal-500",
    icon: Calendar,
    iconColor: "text-teal-600",
  },
}

export function TableQuickActions({
  table,
  open,
  onOpenChange,
  onUpdate,
}: TableQuickActionsProps) {
  const [isPending, startTransition] = useTransition()

  if (!table) return null

  const activeOrders = table.orders?.filter(
    (order) => !["COMPLETED", "CANCELLED"].includes(order.status)
  ) || []

  const oldestActiveOrder = activeOrders.length > 0
    ? activeOrders.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    )
    : null

  // Calculate occupation duration
  const getOccupationDuration = () => {
    if (!oldestActiveOrder) return null

    const now = new Date()
    const orderDate = new Date(oldestActiveOrder.createdAt)
    const diffMs = now.getTime() - orderDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `${diffMins} minutos`
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} horas`
  }

  const occupationDuration = getOccupationDuration()

  const handleStatusChange = (status: "AVAILABLE" | "OCCUPIED" | "RESERVED") => {
    startTransition(async () => {
      const result = await updateTableStatus(table.id, status)
      if (result.success) {
        toast.success(`Mesa marcada como ${statusConfig[status].label.toLowerCase()}`)
        onUpdate?.()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Error al actualizar el estado")
      }
    })
  }

  const config = statusConfig[table.status as keyof typeof statusConfig]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Mesa {table.number}
            <Badge variant="outline" className={cn("gap-1.5", config.color)}>
              <span className={cn("h-2 w-2 rounded-full", config.dot)} />
              {config.label}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Acciones rápidas y detalles de la mesa
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Table Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Capacidad:</span>
              <span className="font-medium">{table.capacity} personas</span>
            </div>

            {table.zone && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Zona:</span>
                <span className="font-medium">{table.zone.name}</span>
              </div>
            )}

            {table.qrCode && (
              <div className="flex items-center gap-2 text-sm">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Código QR:</span>
                <span className="font-medium text-xs truncate">{table.qrCode}</span>
              </div>
            )}

            {occupationDuration && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Ocupada hace:</span>
                <span className="font-medium">{occupationDuration}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Pedidos Activos ({activeOrders.length})</h4>
                <div className="space-y-2">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 rounded-lg bg-muted/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{order.orderNumber || `#${order.id.slice(-4)}`}</span>
                        {order.total !== undefined && (
                          <span className="font-semibold text-sm">
                            S/ {order.total.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {order.user?.name && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {order.user.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Cambiar Estado</h4>
            <div className="grid gap-2">
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => handleStatusChange("AVAILABLE")}
                disabled={table.status === "AVAILABLE" || isPending}
              >
                <CheckCircle2 className="h-4 w-4 text-slate-600" />
                Marcar Disponible
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => handleStatusChange("OCCUPIED")}
                disabled={table.status === "OCCUPIED" || isPending}
              >
                <XCircle className="h-4 w-4 text-blue-600" />
                Marcar Ocupada
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={() => handleStatusChange("RESERVED")}
                disabled={table.status === "RESERVED" || isPending}
              >
                <Calendar className="h-4 w-4 text-teal-600" />
                Marcar Reservada
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
