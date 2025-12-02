"use client"

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"

interface BarChartProps {
  data: Array<{
    name: string
    value: number
  }>
  height?: number
  color?: string
}

export function BarChart({ data, height = 300, color = "var(--chart-5)" }: BarChartProps) {
  const chartConfig = {
    value: {
      label: "Ventas",
      color: color,
    },
  } satisfies ChartConfig

  return (
    <ChartContainer config={chartConfig} className="w-full h-full min-h-[200px]" style={{ height }}>
      <RechartsBarChart accessibilityLayer data={data}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
            <stop offset="100%" stopColor={color} stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `S/ ${value}`}
        />
        <ChartTooltip
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null

            return (
              <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="grid gap-2">
                  <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                      {payload[0].payload.name}
                    </span>
                    <span className="font-bold text-muted-foreground">
                      {formatCurrency(payload[0].value as number)}
                    </span>
                  </div>
                </div>
              </div>
            )
          }}
        />
        <Bar
          dataKey="value"
          fill="url(#barGradient)"
          radius={[8, 8, 0, 0]}
          animationDuration={1500}
        />
      </RechartsBarChart>
    </ChartContainer>
  )
}
