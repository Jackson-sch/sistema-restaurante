"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

interface CategoryBreakdownProps {
  data: {
    name: string
    value: number
    count: number
  }[]
}

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
]

const chartConfig = {
  sales: {
    label: "Ventas",
  },
} satisfies ChartConfig

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  // Take top 6 and group others
  const processedData = data.length > 7
    ? [
      ...data.slice(0, 6),
      {
        name: "Otros",
        value: data.slice(6).reduce((acc, curr) => acc + curr.value, 0),
        count: data.slice(6).reduce((acc, curr) => acc + curr.count, 0)
      }
    ]
    : data

  return (
    <Card className="col-span-4 lg:col-span-2 h-full flex flex-col">
      <CardHeader>
        <CardTitle>Ventas por Categoría</CardTitle>
        <CardDescription>
          Distribución de ingresos por tipo de producto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-[250px] w-full relative">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <Pie
                  data={processedData}
                  dataKey="value"
                  innerRadius={60}
                  strokeWidth={5}
                  stroke="hsl(var(--background))"
                >
                  {processedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel />}
                  formatter={(value, name) => {
                    return (
                      <>
                        <span className="text-xs text-muted-foreground">{name}</span>
                        <span className="text-sm font-semibold">{formatCurrency(value as number)}</span>
                      </>
                    )
                  }
                  }
                />
              </PieChart>
            </ChartContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">
                {processedData.length}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Cats
              </span>
            </div>
          </div>

          <div className="space-y-3 pr-4 max-h-[250px] overflow-y-auto custom-scrollbar">
            {processedData.map((item, index) => (
              <div key={index} className="group flex items-center justify-between text-sm p-2 rounded-lg dark:bg-white/2 bg-muted/20 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="font-medium group-hover:text-primary transition-colors">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-muted-foreground">{item.count} órdenes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
