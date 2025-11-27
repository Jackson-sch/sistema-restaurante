"use client"

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"

interface DonutChartProps {
  data: Array<{
    name: string
    value: number
  }>
  height?: number
  colors?: string[]
}

const DEFAULT_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
]

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null // Don't show label if less than 5%

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="font-bold text-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function DonutChart({ data, height = 300, colors = DEFAULT_COLORS }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          innerRadius={60}
          outerRadius={90}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const total = data.reduce((sum, item) => sum + item.value, 0)
              const percent = ((payload[0].value as number) / total) * 100
              return (
                <div className="rounded-lg border bg-background p-3 shadow-lg">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {payload[0].name}
                      </span>
                      <span className="text-lg font-bold" style={{ color: payload[0].payload.fill }}>
                        S/ {Number(payload[0].value).toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {percent.toFixed(1)}% del total
                      </span>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry: any) => (
            <span className="text-sm text-foreground">{value}</span>
          )}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
