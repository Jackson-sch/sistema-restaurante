"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell } from "recharts"
import { formatCurrency, formatDate } from "@/lib/utils"
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"

interface DifferenceData {
  id: string
  date: Date
  userName: string
  difference: number
  turn: string | null
}

interface DifferenceStatsChartProps {
  data: DifferenceData[]
  tolerance?: number
}

const chartConfig = {
  difference: {
    label: "Diferencia",
  },
  positive: {
    label: "Sobrante",
    color: "var(--chart-6)", // Green
  },
  negative: {
    label: "Faltante",
    color: "var(--destructive)", // Red
  },
} satisfies ChartConfig

export function DifferenceStatsChart({ data, tolerance = 0 }: DifferenceStatsChartProps) {
  // Calculate stats
  const totalDifference = data.reduce((sum, d) => sum + d.difference, 0)
  const avgDifference = data.length > 0 ? totalDifference / data.length : 0
  const withinTolerance = data.filter(d => Math.abs(d.difference) <= tolerance).length
  const toleranceRate = data.length > 0 ? (withinTolerance / data.length) * 100 : 100

  // Prepare chart data
  const chartData = data.slice(0, 10).reverse().map(d => ({
    id: d.id,
    name: formatDate(d.date, "dd/MM"),
    difference: d.difference,
    user: d.userName,
    turn: d.turn,
    withinTolerance: Math.abs(d.difference) <= tolerance,
    fill: d.difference >= 0 ? "var(--chart-6)" : "var(--destructive)"
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Historial de Diferencias
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-0 sm:mb-1">Diferencia Total</div>
            <div className={`text-base sm:text-lg font-bold ${totalDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalDifference >= 0 ? "+" : ""}{formatCurrency(totalDifference)}
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-0 sm:mb-1">Promedio</div>
            <div className={`text-base sm:text-lg font-bold ${avgDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
              {avgDifference >= 0 ? "+" : ""}{formatCurrency(avgDifference)}
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-0 sm:mb-1 flex items-center gap-1">
              {toleranceRate >= 80 ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-amber-600" />
              )}
              <span className="hidden sm:inline">Dentro Tolerancia</span>
              <span className="sm:hidden">Tolerancia</span>
            </div>
            <div className={`text-base sm:text-lg font-bold ${toleranceRate >= 80 ? "text-green-600" : "text-amber-600"}`}>
              {toleranceRate.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-[250px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  minTickGap={30}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value >= 0 ? "+" : ""}${value}`}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {data.name}
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {data.user}
                            </span>
                            <span className={`font-bold ${data.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {data.difference >= 0 ? "+" : ""}{formatCurrency(data.difference)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
                {tolerance > 0 && (
                  <>
                    <ReferenceLine y={tolerance} stroke="var(--muted-foreground)" strokeDasharray="3 3" opacity={0.5} />
                    <ReferenceLine y={-tolerance} stroke="var(--muted-foreground)" strokeDasharray="3 3" opacity={0.5} />
                  </>
                )}
                <ReferenceLine y={0} stroke="var(--muted-foreground)" />
                <Bar dataKey="difference" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.difference >= 0 ? "var(--chart-6)" : "var(--destructive)"}
                      opacity={entry.withinTolerance ? 1 : 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No hay datos de diferencias
          </div>
        )}
      </CardContent>
    </Card>
  )
}
