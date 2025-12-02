"use client"

import { KitchenOrderCard } from "./kitchen-order-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, ChefHat, Bell, Utensils, Sparkles, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface KitchenBoardProps {
    orders: any[]
    onRefresh?: () => void
}

const columns = [
    {
        key: "pending",
        title: "Pendientes",
        statuses: ["PENDING", "CONFIRMED"],
        icon: Clock,
        emptyText: "No hay pedidos pendientes",
        emptySubtext: "Los nuevos pedidos aparecerán aquí",
        bgGradient: "from-slate-50/30 via-zinc-50/20 to-slate-50/30 dark:from-slate-900/20 dark:via-zinc-900/10 dark:to-slate-900/20",
        glowColor: "shadow-slate-200/20 dark:shadow-slate-800/20",
        borderClass: "border-slate-200/40 dark:border-slate-700/40",
        dotClass: "bg-slate-500",
        badgeClass: "bg-slate-500/90 text-white shadow-md",
        iconBgClass: "bg-slate-100/80 dark:bg-slate-800/60",
        iconClass: "text-slate-600 dark:text-slate-300",
        pulseColor: "bg-slate-400",
    },
    {
        key: "preparing",
        title: "En Preparación",
        statuses: ["PREPARING"],
        icon: ChefHat,
        emptyText: "Sin pedidos en cocina",
        emptySubtext: "Mueve pedidos aquí para prepararlos",
        bgGradient: "from-blue-50/30 via-indigo-50/20 to-blue-50/30 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-blue-900/20",
        glowColor: "shadow-blue-200/20 dark:shadow-blue-800/20",
        borderClass: "border-blue-200/40 dark:border-blue-700/40",
        dotClass: "bg-blue-500",
        badgeClass: "bg-blue-500/90 text-white shadow-md",
        iconBgClass: "bg-blue-100/80 dark:bg-blue-800/60",
        iconClass: "text-blue-600 dark:text-blue-300",
        pulseColor: "bg-blue-400",
    },
    {
        key: "ready",
        title: "Listos para Servir",
        statuses: ["READY"],
        icon: Bell,
        emptyText: "No hay pedidos listos",
        emptySubtext: "Los pedidos completados aparecerán aquí",
        bgGradient: "from-teal-50/30 via-cyan-50/20 to-teal-50/30 dark:from-teal-900/20 dark:via-cyan-900/10 dark:to-teal-900/20",
        glowColor: "shadow-teal-200/20 dark:shadow-teal-800/20",
        borderClass: "border-teal-200/40 dark:border-teal-700/40",
        dotClass: "bg-teal-500",
        badgeClass: "bg-teal-500/90 text-white shadow-md",
        iconBgClass: "bg-teal-100/80 dark:bg-teal-800/60",
        iconClass: "text-teal-600 dark:text-teal-300",
        pulseColor: "bg-teal-400",
    },
]

export function KitchenBoard({ orders, onRefresh }: KitchenBoardProps) {
    const [animateNew, setAnimateNew] = useState<Record<string, boolean>>({})

    const getOrdersByStatuses = (statuses: string[]) => orders.filter((o) => statuses.includes(o.status))

    // Transform order data to match KitchenOrderCard expected structure
    const transformOrder = (order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        items: order.items?.map((item: any) => ({
            id: item.id,
            name: item.product?.name || 'Producto',
            quantity: item.quantity,
            notes: item.notes,
        })) || [],
        table: order.table?.number?.toString() || undefined,
        customerName: order.customerName,
        createdAt: order.createdAt,
        type: order.type,
    })

    // Detect new orders for animation
    useEffect(() => {
        const newAnimations: Record<string, boolean> = {}
        orders.forEach((order) => {
            if (!animateNew[order.id]) {
                newAnimations[order.id] = true
                setTimeout(() => {
                    setAnimateNew((prev) => ({ ...prev, [order.id]: false }))
                }, 1000)
            }
        })
        if (Object.keys(newAnimations).length > 0) {
            setAnimateNew((prev) => ({ ...prev, ...newAnimations }))
        }
    }, [orders.length])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
            {columns.map((column) => {
                const columnOrders = getOrdersByStatuses(column.statuses)
                const Icon = column.icon
                const hasOrders = columnOrders.length > 0

                return (
                    <div
                        key={column.key}
                        className={cn(
                            "flex flex-col h-full rounded-2xl transition-all duration-500",
                            "border",
                            column.borderClass,
                            "shadow-lg hover:shadow-xl",
                            column.glowColor,
                            "backdrop-blur-sm",
                            "bg-gradient-to-b",
                            column.bgGradient,
                            hasOrders ? "scale-100" : "scale-[0.98] opacity-80",
                            "hover:scale-[1.005]"
                        )}
                    >
                        {/* Modern Header with Gradient and Animation */}
                        <div className={cn(
                            "relative overflow-hidden rounded-t-xl border-b",
                            column.borderClass,
                            "bg-gradient-to-r",
                            column.bgGradient,
                        )}>
                            {/* Animated background shimmer - más sutil */}
                            {hasOrders && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                            )}

                            <div className="relative flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "relative p-2.5 rounded-xl shadow-sm transition-transform duration-300",
                                        column.iconBgClass,
                                        hasOrders && "animate-pulse-slow"
                                    )}>
                                        {/* Pulse ring para columnas activas - más sutil */}
                                        {hasOrders && (
                                            <div className={cn(
                                                "absolute inset-0 rounded-xl animate-ping opacity-10",
                                                column.pulseColor
                                            )} />
                                        )}
                                        <Icon className={cn("w-5 h-5 relative z-10", column.iconClass)} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
                                            {column.title}
                                            {hasOrders && (
                                                <TrendingUp className={cn("w-4 h-4 animate-bounce", column.iconClass)} />
                                            )}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {columnOrders.length === 0 && "Sin pedidos"}
                                            {columnOrders.length === 1 && "1 pedido activo"}
                                            {columnOrders.length > 1 && `${columnOrders.length} pedidos activos`}
                                        </p>
                                    </div>
                                </div>

                                {/* Enhanced Badge Counter with Animation */}
                                <div className={cn(
                                    "relative flex items-center justify-center h-12 w-12 rounded-xl",
                                    "font-bold text-2xl tabular-nums",
                                    column.badgeClass,
                                    "transition-all duration-300",
                                    hasOrders ? "scale-100 rotate-0" : "scale-90 opacity-50"
                                )}>
                                    {/* Rotating border effect */}
                                    {hasOrders && (
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent animate-spin-slow" />
                                    )}
                                    <span className="relative z-10">{columnOrders.length}</span>
                                </div>
                            </div>

                                {/* Progress bar para columnas activas - más sutil */}
                            {hasOrders && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5 overflow-hidden">
                                    <div className={cn(
                                        "h-full w-1/3 animate-progress opacity-50",
                                        column.pulseColor
                                    )} />
                                </div>
                            )}
                        </div>

                        {/* Orders List with improved spacing */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-3 pb-4">
                                {columnOrders.map((order, index) => (
                                    <div
                                        key={order.id}
                                        className={cn(
                                            "transition-all duration-500",
                                            animateNew[order.id] && "animate-slide-in-bounce"
                                        )}
                                        style={{
                                            animationDelay: `${index * 50}ms`
                                        }}
                                    >
                                        <KitchenOrderCard
                                            order={transformOrder(order)}
                                            onRefresh={onRefresh}
                                        />
                                    </div>
                                ))}

                                {/* Enhanced Empty State */}
                                {columnOrders.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade-in">
                                        <div className={cn(
                                            "relative p-6 rounded-2xl mb-6 border border-dashed",
                                            column.iconBgClass,
                                            column.borderClass,
                                            "transition-all duration-300 hover:scale-105"
                                        )}>
                                            {/* Sparkles animados - más sutiles */}
                                            <Sparkles className="absolute -top-3 -right-3 w-5 h-5 text-yellow-500/40 animate-pulse" />
                                            <Sparkles className="absolute -bottom-2 -left-2 w-3 h-3 text-yellow-400/30 animate-pulse delay-150" />
                                            
                                            {/* Círculo de fondo rotatorio - más sutil */}
                                            <div className={cn(
                                                "absolute inset-0 rounded-2xl opacity-10 animate-spin-slow",
                                                "bg-gradient-to-br",
                                                column.bgGradient
                                            )} />
                                            
                                            <Utensils className={cn(
                                                "w-14 h-14 opacity-40 relative z-10",
                                                column.iconClass,
                                                "animate-float"
                                            )} />
                                        </div>
                                        <p className="font-semibold text-lg text-foreground/70 mb-2">
                                            {column.emptyText}
                                        </p>
                                        <p className="text-sm text-muted-foreground/60 max-w-[200px]">
                                            {column.emptySubtext}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                )
            })}
        </div>
    )
}