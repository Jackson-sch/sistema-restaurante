"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  User,
  MapPin,
  Receipt,
  CreditCard,
  Plus,
  X
} from "lucide-react"
import { getOrderDetails } from "@/actions/order-details"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

interface OrderDetailsDialogProps {
  orderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentClick?: () => void
}

export function OrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
  onPaymentClick
}: OrderDetailsDialogProps) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails()
    }
  }, [open, orderId])

  const fetchOrderDetails = async () => {
    setLoading(true)
    const result = await getOrderDetails(orderId)
    if (result.success && result.data) {
      setOrder(result.data)
    } else {
      toast.error(result.error || "Error al cargar detalles")
    }
    setLoading(false)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Pendiente", color: "bg-amber-100 text-amber-700" }
      case "IN_PROGRESS":
        return { label: "En Preparación", color: "bg-blue-100 text-blue-700" }
      case "READY":
        return { label: "Listo", color: "bg-emerald-100 text-emerald-700" }
      case "SERVED":
        return { label: "Servido", color: "bg-purple-100 text-purple-700" }
      case "COMPLETED":
        return { label: "Completado", color: "bg-gray-100 text-gray-700" }
      case "CANCELLED":
        return { label: "Cancelado", color: "bg-red-100 text-red-700" }
      default:
        return { label: status, color: "bg-muted text-muted-foreground" }
    }
  }

  const getElapsedTime = (createdAt: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(createdAt).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const totalPaid = order?.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
  const remaining = order ? order.total - totalPaid : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Orden {order?.orderNumber || "..."}</span>
            {order && (
              <Badge className={getStatusConfig(order.status).color}>
                {getStatusConfig(order.status).label}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Detalles completos de la orden
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : order ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tiempo:</span>
                  <span className="font-medium">{getElapsedTime(order.createdAt)}</span>
                </div>
                {order.table && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mesa:</span>
                    <span className="font-medium">
                      {order.table.number} {order.table.zone && `- ${order.table.zone.name}`}
                    </span>
                  </div>
                )}
                {order.waiter && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mesero:</span>
                    <span className="font-medium">{order.waiter.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">
                    {order.type === "DINE_IN" ? "Para comer aquí" :
                      order.type === "TAKEOUT" ? "Para llevar" : "Delivery"}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-3">
                <h3 className="font-semibold">Items ({order.items.length})</h3>
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity}x</span>
                        <span>{item.product.name}</span>
                      </div>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground ml-6">
                          Variante: {item.variant.name}
                        </p>
                      )}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-sm text-muted-foreground ml-6 space-y-1">
                          {item.modifiers.map((mod: any) => (
                            <p key={mod.id}>
                              + {mod.modifier.name} ({formatCurrency(mod.price)})
                            </p>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-sm text-muted-foreground ml-6 italic">
                          Nota: {item.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuestos</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Payments */}
              {order.payments && order.payments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Pagos Registrados
                    </h3>
                    {order.payments.map((payment: any) => (
                      <div key={payment.id} className="flex justify-between items-center p-2 rounded bg-muted/30">
                        <div>
                          <p className="font-medium">{payment.method}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                    {remaining > 0 && (
                      <div className="flex justify-between items-center p-2 rounded bg-amber-50 text-amber-900">
                        <span className="font-medium">Pendiente</span>
                        <span className="font-bold">{formatCurrency(remaining)}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No se pudo cargar la orden
          </div>
        )}

        {/* Actions */}
        {order && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            {remaining > 0 && onPaymentClick && (
              <Button onClick={onPaymentClick}>
                <CreditCard className="h-4 w-4 mr-2" />
                Procesar Pago
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
