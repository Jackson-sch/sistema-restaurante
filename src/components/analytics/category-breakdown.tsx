"use client"

import * as React from "react"
import { Cell, Label, Pie, PieChart, Sector } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatCurrency, cn } from "@/lib/utils" // Asumo que tienes cn para clsx/tailwind-merge

interface CategoryBreakdownProps {
  data: {
    name: string
    value: number
    count: number
  }[]
}

const chartConfig = {
  value: {
    label: "Ventas",
  },
} satisfies ChartConfig

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null)

  // 1. Procesamiento de datos y asignación de colores dinámicos del tema
  const processedData = React.useMemo(() => {
    const topData = data.length > 6
      ? [
        ...data.slice(0, 5),
        {
          name: "Otros",
          value: data.slice(5).reduce((acc, curr) => acc + curr.value, 0),
          count: data.slice(5).reduce((acc, curr) => acc + curr.count, 0)
        }
      ]
      : data

    // Asignar variables de color CSS (chart-1, chart-2, etc.)
    return topData.map((item, index) => ({
      ...item,
      fill: `var(--chart-${(index % 5) + 1})`
    }))
  }, [data])

  // 2. Calcular el total para el centro del gráfico
  const totalValue = React.useMemo(() => {
    return processedData.reduce((acc, curr) => acc + curr.value, 0)
  }, [processedData])

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="items-center pb-2">
        <CardTitle>Ventas por Categoría</CardTitle>
        <CardDescription>Distribución de ingresos</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">

          {/* GRÁFICO CIRCULAR */}
          <div className="relative mx-auto aspect-square w-full max-w-[280px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={(value, name) => `${name}: ${formatCurrency(value as number)}`} />}
                />
                <Pie
                  data={processedData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  strokeWidth={2}
                  stroke="hsl(var(--background))" // Borde limpio
                  activeIndex={activeIndex ?? undefined}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  // Efecto visual al hacer hover en el gráfico
                  activeShape={(props: any) => (
                    <Sector {...props} outerRadius={props.outerRadius + 8} />
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
                              {formatCurrency(totalValue).split('.')[0]} {/* Sin decimales para limpieza */}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-xs"
                            >
                              Ventas Totales
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

          {/* LISTA / LEYENDA INTERACTIVA */}
          <div className="flex flex-col justify-center space-y-3 max-h-[300px] overflow-y-auto px-2 custom-scrollbar">
            {processedData.map((item, index) => {
              const percentage = ((item.value / totalValue) * 100).toFixed(1)
              const isActive = activeIndex === index

              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={cn(
                    "relative flex bg-muted/40 dark:bg-muted/10 items-center justify-between p-3 rounded-lg text-sm transition-colors cursor-pointer border border-transparent",
                    isActive
                      ? "bg-muted shadow-sm border-border"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full shadow-sm transition-transform"
                      style={{
                        backgroundColor: item.fill,
                        transform: isActive ? "scale(1.2)" : "scale(1)"
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {percentage}% del total
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold tabular-nums">
                      {formatCurrency(item.value)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} órdenes
                    </p>
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