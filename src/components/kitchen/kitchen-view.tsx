"use client"

import { useEffect, useState } from "react"
import { getKitchenOrders } from "@/actions/orders"
import { KitchenBoard } from "@/components/kitchen/kitchen-board"
import { Button } from "@/components/ui/button"
import { RefreshCw, Activity, TrendingUp, Check } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import StatCard from "@/components/stat-card"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
                toast.success("Pedidos actualizados", {
                    description: `${result.length} pedidos activos`,
                })
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

    // Calculate stats
    const stats = [{
        title: "Total Activos",
        value: orders.length,
        icon: Activity,
        iconColor: "text-primary",
        description: "Pedidos activos en la cocina",

    }, {
        title: "Pendientes",
        value: orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length,
        icon: RefreshCw,
        iconColor: "text-amber-600",
        description: "Pedidos pendientes de confirmación",
    }, {
        title: "En Cocina",
        value: orders.filter(o => o.status === 'PREPARING').length,
        icon: TrendingUp,
        iconColor: "text-orange-600",
        description: "Pedidos en preparación",
    }, {
        title: "Listos",
        value: orders.filter(o => o.status === 'READY').length,
        icon: Check,
        iconColor: "text-green-600",
        description: "Pedidos listos para entrega",
    }]


    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">
                            Sistema de Cocina
                        </h1>
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-green-500 animate-pulse">
                            <Activity className="w-3.5 h-3.5 animate-pulse" />
                            En Vivo
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Gestión de pedidos en tiempo real • KDS
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="default"
                        className="gap-2 shadow-sm"
                        onClick={() => fetchOrders(true)}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.title}
                        {...stat}
                    />
                ))}
            </div>


            {/* Kitchen Board */}
            <div className="flex-1 h-[calc(100vh-200px)]">
                <KitchenBoard orders={orders} onRefresh={() => fetchOrders()} />
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 flex items-center justify-center gap-2 text-xs text-muted-foreground pb-2">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span>Última actualización: {format(lastUpdate, "HH:mm:ss", { locale: es })}</span>
                </div>
                <span>•</span>
                <span>Auto-actualización cada 15s</span>
            </div>
        </div>
    )
}
