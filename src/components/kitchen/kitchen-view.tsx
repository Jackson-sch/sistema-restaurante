"use client"

import { useEffect, useState } from "react"
import { getKitchenOrders } from "@/actions/orders"
import { KitchenBoard } from "@/components/kitchen/kitchen-board"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

type KitchenOrder = Awaited<ReturnType<typeof getKitchenOrders>>[number]

export function KitchenView() {
    const [orders, setOrders] = useState<KitchenOrder[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const fetchOrders = async (showToast = false) => {
        setIsRefreshing(true)
        try {
            const result = await getKitchenOrders()
            setOrders(result)
            setLastUpdate(new Date())
            if (showToast) {
                toast.success("Pedidos actualizados")
            }
        } catch (error) {
            console.error("Error fetching kitchen orders:", error)
            if (showToast) {
                toast.error("Error al actualizar pedidos")
            }
        } finally {
            setIsRefreshing(false)
        }
    }

    // Initial load
    useEffect(() => {
        fetchOrders()
    }, [])

    // Auto-refresh every 15 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchOrders()
        }, 15000) // 15 seconds

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cocina (KDS)</h1>
                    <p className="text-muted-foreground">
                        Gestión de pedidos en tiempo real.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fetchOrders(true)}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    Actualizar
                </Button>
            </div>

            <div className="flex-1">
                <KitchenBoard orders={orders} onRefresh={() => fetchOrders()} />
            </div>

            <div className="text-xs text-muted-foreground text-center pb-2">
                Última actualización: {lastUpdate.toLocaleTimeString()} • Auto-actualización cada 15s
            </div>
        </div>
    )
}
