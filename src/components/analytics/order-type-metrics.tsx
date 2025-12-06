"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Utensils, ShoppingBag, Bike } from "lucide-react"
import { cn } from "@/lib/utils"

interface OrderTypeMetricsProps {
  data: Array<{
    type: string
    totalSales: number
    orderCount: number
    averageTicket: number
    percentage: number
  }>
}

const typeConfig = {
  DINE_IN: {
    label: "Comedor",
    icon: Utensils,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    progressColor: "bg-emerald-500"
  },
  TAKEOUT: {
    label: "Para Llevar",
    icon: ShoppingBag,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    progressColor: "bg-orange-500"
  },
  DELIVERY: {
    label: "Delivery",
    icon: Bike,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    progressColor: "bg-blue-500"
  }
}

export function OrderTypeMetrics({ data }: OrderTypeMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data.map((stat) => {
        const config = typeConfig[stat.type as keyof typeof typeConfig]
        if (!config) return null

        const Icon = config.icon

        return (
          <Card key={stat.type} className="hover:shadow-lg hover:scale-[1.02] transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4">
              <CardTitle className="text-sm font-semibold">
                {config.label}
              </CardTitle>
              <div className={cn("p-1.5 rounded-md", config.bgColor)}>
                <Icon className={cn("h-3.5 w-3.5", config.color)} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {/* Main metric */}
                <div className="text-2xl font-bold tracking-tight">
                  {formatCurrency(stat.totalSales)}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{stat.percentage.toFixed(1)}% del total</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all", config.progressColor)}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Órdenes</p>
                    <p className="text-sm font-semibold">{stat.orderCount}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Promedio</p>
                    <p className="text-sm font-semibold">{formatCurrency(stat.averageTicket)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
