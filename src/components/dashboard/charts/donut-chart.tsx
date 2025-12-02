"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

interface DonutChartProps {
  data: Array<{
    name: string
    value: number
  }>
  height?: number
  colors?: string[]
}

const DEFAULT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function DonutChart({ data, height = 300, colors = DEFAULT_COLORS }: DonutChartProps) {
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length],
    }))
  }, [data, colors])

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Valor",
      },
    }
    data.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: colors[index % colors.length],
      }
    })
    return config
  }, [data, colors])

  const total = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0)
  }, [data])

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto w-full max-w-[300px] aspect-square"
      style={{ height }}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent className=" p-4 gap-2" hideLabel />}
          formatter={(value, name) => {
            return (
              <>
                <span className="text-xs text-muted-foreground">{name}</span>
                <span className="text-sm font-semibold">{formatCurrency(value as number)}</span>
              </>
            )
          }}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
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
                      className="fill-foreground text-xl font-bold"
                    >
                      {formatCurrency(total)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
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
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
