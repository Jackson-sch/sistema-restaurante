"use client"

import * as React from "react"
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface AreaChartProps {
  data: Array<{
    name: string
    value: number
  }>
  height?: number
  color?: string
}

export function AreaChart({ data, height = 300, color = "hsl(var(--primary))" }: AreaChartProps) {
  const chartConfig = {
    value: {
      label: "Ventas",
      color: color,
    },
  } satisfies ChartConfig

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full" style={{ height }}>
      <RechartsAreaChart
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
          content={<ChartTooltipContent indicator="dot" hideLabel />}
        />
        <defs>
          <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-value)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-value)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          type="natural"
          fill="url(#fillValue)"
          fillOpacity={0.4}
          stroke="var(--color-value)"
          stackId="a"
        />
      </RechartsAreaChart>
    </ChartContainer>
  )
}
