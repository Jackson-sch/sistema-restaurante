"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { ComparisonBadge } from "@/components/dashboard/comparison-badge"
import { formatCurrency, formatDate } from "@/lib/utils"

const chartConfig = {
  amount: {
    label: "Ventas",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface SalesTrendChartProps {
  data: Array<{
    date: string
    amount: number
  }>
  trendValue?: number
}

export function SalesTrendChart({ data, trendValue }: SalesTrendChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Tendencia de Ventas</CardTitle>
            <CardDescription className="mt-1">Ingresos diarios en el periodo seleccionado</CardDescription>
          </div>
          {trendValue !== undefined && (
            <ComparisonBadge value={trendValue} />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-[200px] md:h-[280px] w-full">
          <AreaChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                return formatDate(date, "d MMM")
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
                  formatter={(value: any) => (
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-muted-foreground">Ventas</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(value)}
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
  )
}
