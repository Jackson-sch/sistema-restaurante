"use client"

import { KitchenOrderCard } from "./kitchen-order-card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface KitchenBoardProps {
    orders: any[]
    onRefresh?: () => void
}

export function KitchenBoard({ orders, onRefresh }: KitchenBoardProps) {
    const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED')
    const preparingOrders = orders.filter(o => o.status === 'PREPARING')
    const readyOrders = orders.filter(o => o.status === 'READY')

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Pendientes column */}
            <div className="flex flex-col h-full bg-muted/30 rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500" />
                        Pendientes
                    </h3>
                    <span className="bg-muted px-2 py-1 rounded text-sm font-medium">
                        {pendingOrders.length}
                    </span>
                </div>
                <ScrollArea className="flex-1 -mr-3 pr-3">
                    <div className="space-y-4">
                        {pendingOrders.map(order => (
                            <KitchenOrderCard key={order.id} order={order} onRefresh={onRefresh} />
                        ))}
                        {pendingOrders.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No hay pedidos pendientes
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* En Preparación column */}
            <div className="flex flex-col h-full bg-muted/30 rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500" />
                        En Preparación
                    </h3>
                    <span className="bg-muted px-2 py-1 rounded text-sm font-medium">
                        {preparingOrders.length}
                    </span>
                </div>
                <ScrollArea className="flex-1 -mr-3 pr-3">
                    <div className="space-y-4">
                        {preparingOrders.map(order => (
                            <KitchenOrderCard key={order.id} order={order} onRefresh={onRefresh} />
                        ))}
                        {preparingOrders.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No hay pedidos en preparación
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Listos column */}
            <div className="flex flex-col h-full bg-muted/30 rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        Listos para Servir
                    </h3>
                    <span className="bg-muted px-2 py-1 rounded text-sm font-medium">
                        {readyOrders.length}
                    </span>
                </div>
                <ScrollArea className="flex-1 -mr-3 pr-3">
                    <div className="space-y-4">
                        {readyOrders.map(order => (
                            <KitchenOrderCard key={order.id} order={order} onRefresh={onRefresh} />
                        ))}
                        {readyOrders.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No hay pedidos listos
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
