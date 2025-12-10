"use client"

import { useState, useEffect, useTransition } from "react"
import type { DateRange } from "react-day-picker"
import { subDays } from "date-fns"
import { getProductPerformanceReport } from "@/actions/reports"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { toast } from "sonner"

const CATEGORY_COLORS = [
  { color: "hsl(221, 83%, 53%)", id: "cat-1" }, // Azul
  { color: "hsl(142, 71%, 45%)", id: "cat-2" }, // Verde
  { color: "hsl(262, 83%, 58%)", id: "cat-3" }, // Púrpura
  { color: "hsl(24, 95%, 53%)", id: "cat-4" }, // Naranja
  { color: "hsl(349, 89%, 60%)", id: "cat-5" }, // Rosa
  { color: "hsl(187, 85%, 43%)", id: "cat-6" }, // Cyan
  { color: "hsl(47, 96%, 53%)", id: "cat-7" }, // Amarillo
  { color: "hsl(291, 64%, 42%)", id: "cat-8" }, // Magenta
]

const productChartConfig = {
  quantity: {
    label: "Cantidad",
    color: "hsl(221, 83%, 53%)",
  },
} satisfies ChartConfig

const categoryChartConfig = {
  revenue: {
    label: "Ingresos",
    color: "hsl(var(--chart-3))",
  },
  ...Object.fromEntries(
    CATEGORY_COLORS.map((c, i) => [`category-${i}`, { label: `Categoría ${i + 1}`, color: c.color }]),
  ),
} satisfies ChartConfig

export function ProductPerformanceReport() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [data, setData] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [isVisible, setIsVisible] = useState(false)

  const fetchData = () => {
    if (!date?.from) return

    startTransition(async () => {
      const result = await getProductPerformanceReport(date.from, date.to)
      if (result.success) {
        setData(result.data)
        setIsVisible(false)
        setTimeout(() => setIsVisible(true), 50)
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
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rendimiento de Productos</h2>
          <p className="text-muted-foreground">Análisis de ventas por producto y categoría.</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange date={date} setDate={setDate} />
          <Button onClick={fetchData} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Products Chart */}
        <Card className="col-span-2 lg:col-span-1 overflow-hidden">
          <CardHeader>
            <CardTitle>Top 10 Productos Más Vendidos</CardTitle>
            <CardDescription>Basado en cantidad de unidades vendidas.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={productChartConfig} className="min-h-[250px] md:min-h-[350px] w-full">
              <BarChart
                accessibilityLayer
                data={data.topProducts}
                layout="vertical"
                margin={{
                  left: 0,
                }}
              >
                <defs>
                  <linearGradient id="fillQuantity" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/50" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  width={80}
                  tickFormatter={(value) => (value.length > 10 ? `${value.substring(0, 10)}...` : value)}
                  className="text-xs"
                />
                <XAxis dataKey="quantity" type="number" hide />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--primary))", opacity: 0.08 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="quantity"
                  fill="url(#fillQuantity)"
                  radius={[0, 8, 8, 0]}
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={0.5}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                  isAnimationActive={isVisible}
                >
                  <LabelList
                    dataKey="quantity"
                    position="right"
                    offset={8}
                    className="fill-foreground font-semibold"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Categories Chart */}
        <Card className="col-span-2 lg:col-span-1 overflow-hidden">
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
            <CardDescription>Ingresos generados por cada categoría.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryChartConfig} className="min-h-[250px] md:min-h-[350px] w-full">
              <BarChart
                accessibilityLayer
                data={data.topCategories}
                layout="vertical"
                margin={{
                  left: 0,
                  right: 22,
                }}
              >
                <defs>
                  {CATEGORY_COLORS.map((cat, index) => (
                    <linearGradient key={cat.id} id={`fill-${cat.id}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={cat.color} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={cat.color} stopOpacity={0.5} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/50" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  width={80}
                  className="text-xs"
                />
                <XAxis dataKey="revenue" type="number" hide />
                <ChartTooltip
                  cursor={{ fill: "hsl(var(--primary))", opacity: 0.08 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="revenue"
                  radius={[0, 8, 8, 0]}
                  animationBegin={100}
                  animationDuration={800}
                  animationEasing="ease-out"
                  isAnimationActive={isVisible}
                >
                  {data.topCategories?.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#fill-${CATEGORY_COLORS[index % CATEGORY_COLORS.length].id})`}
                      stroke={CATEGORY_COLORS[index % CATEGORY_COLORS.length].color}
                      strokeWidth={0.5}
                      className="transition-opacity duration-200 hover:opacity-80"
                    />
                  ))}
                  <LabelList
                    dataKey="revenue"
                    position="right"
                    offset={4}
                    className="fill-foreground font-semibold"
                    fontSize={12}
                    formatter={(value: any) => `S/ ${Number(value).toFixed(0)}`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
