"use client"

import { Bar, ComposedChart, Line, CartesianGrid, XAxis, YAxis, Area, ReferenceLine } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import { useMemo } from "react"
import { TrendingDown, TrendingUp } from "lucide-react"

interface WeeklyComparisonChartProps {
  data: {
    day: string
    current: number
    previous: number
  }[]
}

const chartConfig = {
  current: {
    label: "Esta Semana",
    color: "var(--chart-1)", // Blue
  },
  previous: {
    label: "Semana Anterior",
    color: "var(--chart-5)", // Emerald
  },
} satisfies ChartConfig

export function WeeklyComparisonChart({ data }: WeeklyComparisonChartProps) {
  // Calcular estadisticas de comparación
  const stats = useMemo(() => {
    const totalCurrent = data.reduce((sum, d) => sum + d.current, 0)
    const totalPrevious = data.reduce((sum, d) => sum + d.previous, 0)
    const difference = totalCurrent - totalPrevious
    const percentChange = totalPrevious > 0 ? (difference / totalPrevious) * 100 : 0
    const avgPrevious = totalPrevious / data.length
    return {
      totalCurrent,
      totalPrevious,
      difference,
      percentChange,
      avgPrevious,
      isPositive: percentChange >= 0,
    }
  }, [data])

  return (
    <Card className="col-span-4">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle>Comparativa Semanal</CardTitle>
          <CardDescription>Ventas de esta semana vs semana anterior</CardDescription>
        </div>
        {/* Indicador de variación */}
        <div
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium ${stats.isPositive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
        >
          {stats.isPositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          <span>
            {stats.isPositive ? "+" : ""}
            {stats.percentChange.toFixed(1)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ComposedChart data={data} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-5)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-5)" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" vertical={false} />

              {/* Linea de referencia del promedio de la semana anterior */}
              <ReferenceLine
                y={stats.avgPrevious}
                stroke="var(--chart-5)"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
                label={{
                  value: "Prom. anterior",
                  position: "center",
                  fill: "var(--chart-5)",
                  fontSize: 12,
                }}
              />
              <XAxis
                dataKey="day"
                stroke="var(--muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="var(--muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${formatCurrency(value)}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label}
                        </span>
                        <span className="font-mono font-medium">{formatCurrency(value as number)}</span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend
                verticalAlign="top"
                height={36}
                content={<ChartLegendContent />}
              />
              <Bar
                dataKey="current"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                barSize={32}
                animationDuration={1500}
              />
              <Area
                type="monotone"
                dataKey="previous"
                fill="url(#lineGradient)"
                stroke="var(--color-previous)"
                strokeWidth={2}
                strokeOpacity={0.7}
                animationDuration={1500}
                dot={{
                  r: 4,
                  fill: "var(--color-previous)",
                  stroke: "var(--color-previous)",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "var(--color-previous)",
                  stroke: "var(--color-previous)",
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
