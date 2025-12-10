"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import type { DateRange } from "react-day-picker"
import { subDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { getSalesReport } from "@/actions/reports"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Loader2,
    DollarSign,
    ShoppingBag,
    CreditCard,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Calendar,
} from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"
import { SalesTrendChart } from "./sales-trend-chart"
import { PaymentMethodsChart } from "./payment-methods-chart"
import StatCard from "../stat-card"


export function SalesReport() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    })
    const [data, setData] = useState<any>(null)
    const [isPending, startTransition] = useTransition()

    const fetchData = () => {
        if (!date?.from) return

        startTransition(async () => {
            const result = await getSalesReport(date.from, date.to)
            if (result.success) {
                setData(result.data)
            } else {
                toast.error(result.error)
            }
        })
    }

    useEffect(() => {
        fetchData()
    }, [date])

    if (!data && isPending) {
        return (
            <div className="flex h-[500px] flex-col items-center justify-center gap-3">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-muted" />
                    <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
                <p className="text-sm text-muted-foreground">Cargando reporte...</p>
            </div>
        )
    }

    if (!data) return null

    const dateRangeText =
        date?.from && date?.to
            ? `${format(date.from, "d MMM", { locale: es })} - ${format(date.to, "d MMM yyyy", { locale: es })}`
            : "Selecciona un rango"

    // Helper to format trend value
    const formatTrend = (value: number) => `${value >= 0 ? '+' : ''}${value}%`
    const getTrendDirection = (value: number) => value > 0 ? 'up' : value < 0 ? 'down' : 'neutral'

    const stats = [{
        title: "Ventas Totales",
        value: formatCurrency(data.summary.totalSales),
        description: "Ingresos en el periodo",
        icon: DollarSign,
        iconColor: "text-emerald-600",
        comparison: data.summary.salesTrend,
    }, {
        title: "Total Pedidos",
        value: data.summary.totalOrders,
        description: "Pedidos en el periodo",
        icon: ShoppingBag,
        iconColor: "text-amber-600",
        comparison: data.summary.ordersTrend,
    }, {
        title: "Ticket Promedio",
        value: formatCurrency(data.summary.averageTicket),
        description: "Ticket promedio en el periodo",
        icon: CreditCard,
        iconColor: "text-orange-600",
        comparison: data.summary.ticketTrend,
    }]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reporte de Ventas</h2>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {dateRangeText}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DatePickerWithRange date={date} setDate={setDate} />
                    <Button onClick={fetchData} disabled={isPending} size="sm" className="gap-2">
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="hidden sm:inline">Actualizar</span>
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.title}
                        {...stat}
                    />
                ))}
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2   ">
                <SalesTrendChart data={data.salesTrend} trendValue ={data.summary.salesTrend} />
                <PaymentMethodsChart
                    data={data.salesByMethod}
                    totalOrders={data.summary.totalOrders}
                />
            </div>
        </div>
    )
}
