"use client"

import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

interface BarChartProps {
  data: Array<{
    name: string
    value: number
  }>
  height?: number
  color?: string
}

export function BarChart({ data, height = 300, color = "#3b82f6" }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <defs>
          <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
        <XAxis
          dataKey="name"
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `S/ ${value}`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-3 shadow-lg">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {payload[0].payload.name}
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        S/ {Number(payload[0].value).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Bar
          dataKey="value"
          fill="url(#colorBar)"
          radius={[8, 8, 0, 0]}
          maxBarSize={60}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
