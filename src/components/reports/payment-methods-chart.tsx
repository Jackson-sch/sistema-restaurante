"use client"

import type React from "react"
import { PieChart, Pie, Cell, Label } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import {
  Banknote,
  CreditCard,
  Smartphone,
  ArrowRightLeft,
  Layers,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const pieChartConfig = {
  amount: {
    label: "Monto",
  },
  CASH: {
    label: "Efectivo",
    color: "var(--chart-1)",
  },
  CARD: {
    label: "Tarjeta",
    color: "var(--chart-2)",
  },
  YAPE: {
    label: "Yape",
    color: "var(--chart-3)",
  },
  PLIN: {
    label: "Plin",
    color: "var(--chart-4)",
  },
  TRANSFER: {
    label: "Transferencia",
    color: "var(--chart-5)",
  },
  MIXED: {
    label: "Mixto",
    color: "var(--chart-6)",
  },
} satisfies ChartConfig

const methodIcons: Record<string, React.ReactNode> = {
  CASH: <Banknote className="h-3.5 w-3.5" />,
  CARD: <CreditCard className="h-3.5 w-3.5" />,
  YAPE: <Smartphone className="h-3.5 w-3.5" />,
  PLIN: <Smartphone className="h-3.5 w-3.5" />,
  TRANSFER: <ArrowRightLeft className="h-3.5 w-3.5" />,
  MIXED: <Layers className="h-3.5 w-3.5" />,
}

function PaymentMethodLegend({ data }: { data: Array<{ method: string; amount: number; fill: string }> }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      {data.map((item) => {
        const config = pieChartConfig[item.method as keyof typeof pieChartConfig] as { label?: string } | undefined
        const percentage = ((item.amount / total) * 100).toFixed(1)

        return (
          <div
            key={item.method}
            className="flex items-center gap-2 rounded-lg border bg-card p-2.5 transition-colors hover:bg-accent/50"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${item.fill}20`, color: item.fill }}
            >
              {methodIcons[item.method]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{config?.label || item.method}</p>
              <p className="text-xs text-muted-foreground">
                {percentage}% · {formatCurrency(item.amount)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface PaymentMethodsChartProps {
  data: Array<{
    method: string
    amount: number
  }>
  totalOrders: number
}

export function PaymentMethodsChart({ data, totalOrders }: PaymentMethodsChartProps) {
  const pieData = data.map((item) => {
    const configItem = pieChartConfig[item.method as keyof typeof pieChartConfig] as { color?: string } | undefined
    return {
      ...item,
      fill: configItem?.color || "var(--chart-5)",
    }
  })

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold">Métodos de Pago</CardTitle>
        <CardDescription>Distribución de ventas por método</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[150px] md:max-h-[200px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value: any, name: any, props: any) => {
                    const config = pieChartConfig[props.payload.method as keyof typeof pieChartConfig] as
                      | { label?: string }
                      | undefined
                    return (
                      <div className="flex items-center justify-between gap-8">
                        <span className="text-muted-foreground">{config?.label || props.payload.method}</span>
                        <span className="font-mono font-semibold">
                          {formatCurrency(value)}
                        </span>
                      </div>
                    )
                  }}
                />
              }
            />
            <Pie
              data={pieData}
              dataKey="amount"
              nameKey="method"
              innerRadius={45}
              outerRadius={70}
              strokeWidth={0}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle" className="fill-foreground">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="text-3xl font-bold">
                          {totalOrders}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="text-xs fill-muted-foreground">
                          Pedidos
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <PaymentMethodLegend data={pieData} />
      </CardContent>
    </Card>
  )
}

export { pieChartConfig }
