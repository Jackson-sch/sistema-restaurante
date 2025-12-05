"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, ChevronRight, User, Flame, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateOrderStatus } from "@/actions/orders"
import { toast } from "sonner"
import { OrderTimer } from "./order-timer"

interface KitchenOrderCardProps {
    order: {
        id: string
        orderNumber?: string
        status: string
        items?: Array<{
            id: string
            name: string
            quantity: number
            notes?: string
        }>
        table?: string
        customerName?: string
        createdAt?: string | Date
        type?: string
    }
    onRefresh?: () => void
}

const statusActions: Record<
    string,
    { label: string; nextStatus: string; icon: any; variant: "default" | "secondary" | "destructive" }
> = {
    PENDING: { label: "Comenzar Preparación", nextStatus: "PREPARING", icon: Flame, variant: "default" },
    CONFIRMED: { label: "Comenzar Preparación", nextStatus: "PREPARING", icon: Flame, variant: "default" },
    PREPARING: { label: "Marcar como Listo", nextStatus: "READY", icon: CheckCircle2, variant: "default" },
    READY: { label: "Servir Pedido", nextStatus: "SERVED", icon: ChevronRight, variant: "secondary" },
}

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
    PENDING: {
        color: "text-slate-600 dark:text-slate-300",
        bgColor: "bg-slate-100/80 dark:bg-slate-800/60",
        label: "Pendiente",
    },
    CONFIRMED: {
        color: "text-slate-600 dark:text-slate-300",
        bgColor: "bg-slate-100/80 dark:bg-slate-800/60",
        label: "Confirmado",
    },
    PREPARING: {
        color: "text-blue-600 dark:text-blue-300",
        bgColor: "bg-blue-100/80 dark:bg-blue-800/60",
        label: "En Cocina",
    },
    READY: {
        color: "text-teal-600 dark:text-teal-300",
        bgColor: "bg-teal-100/80 dark:bg-teal-800/60",
        label: "Listo",
    },
}

export function KitchenOrderCard({ order, onRefresh }: KitchenOrderCardProps) {
    const [isUpdating, setIsUpdating] = useState<boolean>(false)
    const action = statusActions[order.status]
    const config = statusConfig[order.status]

    const getTimeAgo = (date: string | Date): string => {
        const now = new Date()
        const orderDate = new Date(date)
        const diffMs = now.getTime() - orderDate.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return "Ahora"
        if (diffMins < 60) return `${diffMins} min`
        const diffHours = Math.floor(diffMins / 60)
        return `${diffHours}h ${diffMins % 60}m`
    }

    const getUrgencyClass = (date: string | Date): string => {
        const now = new Date()
        const orderDate = new Date(date)
        const diffMins = Math.floor((now.getTime() - orderDate.getTime()) / 60000)

        if (diffMins > 30) return "border-orange-400/40 border-1 shadow-orange-400/10"
        if (diffMins > 15) return "border-amber-400/40 border-1 shadow-amber-400/10"
        return ""
    }

    const handleAction = async () => {
        if (!action) return

        setIsUpdating(true)
        try {
            const result = await updateOrderStatus(order.id, action.nextStatus)

            if (result.success) {
                toast.success(`Pedido ${order.orderNumber} actualizado`)
                onRefresh?.()
            } else {
                toast.error(result.error || "Error al actualizar el pedido")
            }
        } catch (error) {
            console.error("Error updating order:", error)
            toast.error("Error al actualizar el pedido")
        } finally {
            setIsUpdating(false)
        }
    }

    const ActionIcon = action?.icon

    return (
        <Card
            className={cn(
                "overflow-hidden transition-all hover:shadow-lg",
                order.createdAt && getUrgencyClass(order.createdAt),
                "group"
            )}
        >
            <CardHeader className="p-3 pb-2 space-y-2">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-xl tracking-tight">
                            #{order.orderNumber || order.id.slice(-4)}
                        </span>
                        {config && (
                            <Badge className={cn("text-xs font-semibold", config.bgColor, config.color)}>
                                {config.label}
                            </Badge>
                        )}
                    </div>
                    {order.createdAt && (
                        <OrderTimer createdAt={new Date(order.createdAt)} />
                    )}
                </div>

                {/* Meta Information */}
                <div className="flex items-center gap-4 text-sm">
                    {order.table && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">Mesa {order.table}</span>
                        </div>
                    )}
                    {order.customerName && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{order.customerName}</span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-3 pt-0 space-y-2">
                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                    <div className="space-y-2">
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                            >
                                <div className="flex items-center justify-center w-8 h-8 border-1 border-primary/20 bg-background/50 rounded-md">
                                    <span className="font-bold text-sm text-primary">{item.quantity}×</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold leading-tight">{item.name}</p>
                                    {item.notes && (
                                        <div className="flex items-start gap-1.5 mt-1">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-500/70 dark:text-amber-400/70 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium italic leading-tight">
                                                {item.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Button */}
                {action && (
                    <Button
                        onClick={handleAction}
                        disabled={isUpdating}
                        className={cn(
                            "w-full gap-2 h-9 text-base font-semibold shadow-md transition-all",
                            order.status === "READY" &&
                            "bg-teal-500/90 hover:bg-teal-600 dark:bg-teal-600/90 dark:hover:bg-teal-700",
                            order.status === "PREPARING" &&
                            "bg-blue-500/90 hover:bg-blue-600 dark:bg-blue-600/90 dark:hover:bg-blue-700",
                            (order.status === "PENDING" || order.status === "CONFIRMED") &&
                            "bg-slate-500/90 hover:bg-slate-600 dark:bg-slate-600/90 dark:hover:bg-slate-700"
                        )}
                        variant={action.variant}
                    >
                        {isUpdating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Actualizando...
                            </>
                        ) : (
                            <>
                                {ActionIcon && <ActionIcon className="w-5 h-5" />}
                                {action.label}
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}