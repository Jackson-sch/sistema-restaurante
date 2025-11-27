"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import type { DateRange } from "react-day-picker"
import { subDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { getSalesReport } from "@/actions/reports"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
    Banknote,
    Smartphone,
    ArrowRightLeft,
    Layers,
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { toast } from "sonner"

const chartConfig = {
    amount: {
        label: "Ventas",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

const pieChartConfig = {
    amount: {
        label: "Monto",
    },
    CASH: {
        label: "Efectivo",
        color: "var(--chart-1)",
    },
    CARD: {
        label: "Tarjeta",
        color: "var(--chart-2)",
    },
    YAPE: {
        label: "Yape",
        color: "var(--chart-3)",
    },
    PLIN: {
        label: "Plin",
        color: "var(--chart-4)",
    },
    TRANSFER: {
        label: "Transferencia",
        color: "var(--chart-5)",
    },
    MIXED: {
        label: "Mixto",
        color: "var(--chart-6)",
    },
} satisfies ChartConfig

const methodIcons: Record<string, React.ReactNode> = {
    CASH: <Banknote className="h-3.5 w-3.5" />,
    CARD: <CreditCard className="h-3.5 w-3.5" />,
    YAPE: <Smartphone className="h-3.5 w-3.5" />,
    PLIN: <Smartphone className="h-3.5 w-3.5" />,
    TRANSFER: <ArrowRightLeft className="h-3.5 w-3.5" />,
    MIXED: <Layers className="h-3.5 w-3.5" />,
}

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
}: {
    title: string
    value: string
    subtitle: string
    icon: React.ElementType
    trend?: "up" | "down" | "neutral"
    trendValue?: string
}) {
    return (
        <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">{value}</span>
                    {trend && trendValue && (
                        <Badge
                            variant="secondary"
                            className={`gap-1 ${trend === "up"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : trend === "down"
                                    ? "bg-red-500/10 text-red-600"
                                    : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {trend === "up" ? (
                                <TrendingUp className="h-3 w-3" />
                            ) : trend === "down" ? (
                                <TrendingDown className="h-3 w-3" />
                            ) : null}
                            {trendValue}
                        </Badge>
                    )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            </CardContent>
        </Card>
    )
}

function PaymentMethodLegend({ data }: { data: Array<{ method: string; amount: number; fill: string }> }) {
    const total = data.reduce((sum, item) => sum + item.amount, 0)

    return (
        <div className="mt-4 grid grid-cols-2 gap-2">
            {data.map((item) => {
                const config = pieChartConfig[item.method as keyof typeof pieChartConfig] as { label?: string } | undefined
                const percentage = ((item.amount / total) * 100).toFixed(1)

                return (
                    <div
                        key={item.method}
                        className="flex items-center gap-2 rounded-lg border bg-card p-2.5 transition-colors hover:bg-accent/50"
                    >
                        <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                            style={{ backgroundColor: `${item.fill}20`, color: item.fill }}
                        >
                            {methodIcons[item.method]}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{config?.label || item.method}</p>
                            <p className="text-xs text-muted-foreground">
                                {percentage}% · S/ {item.amount.toFixed(0)}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

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

    const pieData = data.salesByMethod.map((item: any) => {
        const configItem = pieChartConfig[item.method as keyof typeof pieChartConfig] as { color?: string } | undefined
        return {
            ...item,
            fill: configItem?.color || "var(--chart-5)",
        }
    })

    const dateRangeText =
        date?.from && date?.to
            ? `${format(date.from, "d MMM", { locale: es })} - ${format(date.to, "d MMM yyyy", { locale: es })}`
            : "Selecciona un rango"

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Ventas Totales"
                    value={`S/ ${data.summary.totalSales.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
                    subtitle="Ingresos en el periodo"
                    icon={DollarSign}
                    trend="up"
                    trendValue="+12.5%"
                />
                <StatCard
                    title="Total Pedidos"
                    value={data.summary.totalOrders.toLocaleString()}
                    subtitle="Transacciones completadas"
                    icon={ShoppingBag}
                    trend="up"
                    trendValue="+8.2%"
                />
                <StatCard
                    title="Ticket Promedio"
                    value={`S/ ${data.summary.averageTicket.toFixed(2)}`}
                    subtitle="Por transacción"
                    icon={CreditCard}
                    trend="neutral"
                    trendValue="+0.3%"
                />
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-5">
                {/* Area Chart - Sales Trend */}
                <Card className="lg:col-span-3">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Tendencia de Ventas</CardTitle>
                                <CardDescription className="mt-1">Ingresos diarios en el periodo seleccionado</CardDescription>
                            </div>
                            <Badge variant="secondary" className="gap-1">
                                <TrendingUp className="h-3 w-3" />
                                +12.5%
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ChartContainer config={chartConfig} className="h-[280px] w-full">
                            <AreaChart accessibilityLayer data={data.salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => {
                                        const date = new Date(value)
                                        return format(date, "d MMM", { locale: es })
                                    }}
                                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value) => `S/${value}`}
                                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                                    width={60}
                                />
                                <ChartTooltip
                                    cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value, name) => (
                                                <div className="flex items-center justify-between gap-8">
                                                    <span className="text-muted-foreground">Ventas</span>
                                                    <span className="font-mono font-semibold">
                                                        S/ {Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="var(--chart-1)"
                                    strokeWidth={2}
                                    fill="url(#colorAmount)"
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--background)" }}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-base font-semibold">Métodos de Pago</CardTitle>
                        <CardDescription>Distribución de ventas por método</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[200px]">
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value, name, props) => {
                                                const config = pieChartConfig[props.payload.method as keyof typeof pieChartConfig] as
                                                    | { label?: string }
                                                    | undefined
                                                return (
                                                    <div className="flex items-center justify-between gap-8">
                                                        <span className="text-muted-foreground">{config?.label || props.payload.method}</span>
                                                        <span className="font-mono font-semibold">
                                                            S/ {Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )
                                            }}
                                        />
                                    }
                                />
                                <Pie
                                    data={pieData}
                                    dataKey="amount"
                                    nameKey="method"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    strokeWidth={0}
                                >
                                    {pieData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                                    <tspan x="50%" dy="-0.5em" className="text-2xl font-bold">
                                        {data.summary.totalOrders}
                                    </tspan>
                                    <tspan x="50%" dy="1.5em" className="text-xs fill-muted-foreground">
                                        Pedidos
                                    </tspan>
                                </text>
                            </PieChart>
                        </ChartContainer>
                        <PaymentMethodLegend data={pieData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
