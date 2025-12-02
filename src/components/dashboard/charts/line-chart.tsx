"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface LineChartProps {
  data: Array<{
    name: string
    value: number
  }>
  height?: number
  color?: string
}

export function LineChart({ data, height = 300, color = "hsl(var(--primary))" }: LineChartProps) {
  const chartConfig = {
    value: {
      label: "Ventas",
      color: color,
    },
  } satisfies ChartConfig

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full" style={{ height }}>
      <RechartsLineChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `S/ ${value}`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Line
          dataKey="value"
          type="natural"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={false}
        />
      </RechartsLineChart>
    </ChartContainer>
  )
}
