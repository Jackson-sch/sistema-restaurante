"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatCurrency, cn } from "@/lib/utils"
import { Bike, ShoppingBag, Utensils } from "lucide-react"

interface OrderTypeBreakdownChartProps {
  data: Array<{
    type: string
    totalSales: number
    percentage: number
  }>
}

// Configuración visual y semántica
const chartConfig = {
  sales: {
    label: "Ventas",
  },
  DINE_IN: {
    label: "Comedor",
    color: "var(--chart-1)",
    icon: Utensils,
  },
  TAKEOUT: {
    label: "Para Llevar",
    color: "var(--chart-5)",
    icon: ShoppingBag,
  },
  DELIVERY: {
    label: "Delivery",
    color: "var(--chart-9)",
    icon: Bike,
  },
} satisfies ChartConfig

export function OrderTypeBreakdownChart({ data }: OrderTypeBreakdownChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

  // 1. Preparar datos con colores y config
  const processedData = React.useMemo(() => {
    return data.map((item) => {
      const configKey = item.type as keyof typeof chartConfig
      // Excluir 'sales' que no tiene color/icon, y proporcionar fallback
      const config = (configKey !== 'sales' && chartConfig[configKey])
        ? chartConfig[configKey]
        : { label: item.type, color: "var(--muted-foreground)", icon: null }

      return {
        ...item,
        name: config.label,
        fill: config.color,
        icon: config.icon
      }
    })
  }, [data])

  // 2. Calcular total para el centro
  const totalSales = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.totalSales, 0)
  }, [data])

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center">
        <CardTitle>Canales de Venta</CardTitle>
        <CardDescription>Distribución por tipo de servicio</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center h-full">

          {/* GRÁFICO DONUT */}
          <div className="relative aspect-square w-full max-w-[250px] mx-auto">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={processedData}
                  dataKey="totalSales"
                  nameKey="type" // Usamos el key original para el tooltip config
                  innerRadius={65}
                  outerRadius={90}
                  strokeWidth={3}
                  activeIndex={activeIndex ?? undefined}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  activeShape={(props: any) => (
                    <Sector {...props} outerRadius={props.outerRadius + 6} />
                  )}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-bold"
                            >
                              {/* Versión compacta del número */}
                              {totalSales > 1000
                                ? `${(totalSales / 1000).toFixed(1)}k`
                                : totalSales}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 20}
                              className="fill-muted-foreground text-xs"
                            >
                              Total
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>

          {/* LEYENDA DETALLADA */}
          <div className="flex flex-col justify-center gap-3">
            {processedData.map((item, index) => {
              const isActive = activeIndex === index
              const Icon = item.icon

              return (
                <div
                  key={item.type}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={cn(
                    "flex items-center bg-muted/40 dark:bg-muted/10 justify-between p-3 rounded-xl border border-transparent transition-all cursor-pointer",
                    isActive
                      ? "bg-muted/20 shadow-sm border-border scale-[1.02]"
                      : "hover:bg-muted/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                      style={{ backgroundColor: `${item.fill}20`, color: item.fill }} // Fondo con 20% opacidad
                    >
                      {Icon && <Icon className="w-5 h-5" />}
                    </div>

                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(item.totalSales)}</p>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </CardContent>
    </Card>
  )
}