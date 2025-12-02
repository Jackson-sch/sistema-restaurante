"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, TrendingUp, ShoppingBag } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Separator } from "../ui/separator"

interface WaiterPerformanceProps {
  data: {
    id: string
    name: string
    orders: number
    sales: number
    averageTicket: number
  }[]
}

// Helper para obtner el estilo del Top 3
const getRankingStyles = (index: number) => {
  if (index === 0) {
    return {
      avatar: "border-4 border-amber-400 ring-4 ring-amber-200/50 shadow-lg",
      badge: "bg-amber-400 text-amber-900 border-amber-500",
      barColor: "from-amber-500 to-orange-500",
      container: "bg-amber-50/50 dark:bg-zinc-800/30 rounded-lg p-2 -m-2", // Destacar toda la fila
    }
  }
  if (index === 1) {
    return {
      avatar: "border-2 border-slate-300 dark:border-slate-500",
      badge: "bg-slate-300 text-slate-800 border-slate-400",
      barColor: "from-slate-400 to-slate-500",
      container: "bg-muted/30 dark:bg-zinc-800/20 rounded-lg p-2 -m-2",
    }
  }
  if (index === 2) {
    return {
      avatar: "border-2 border-yellow-700/50 dark:border-yellow-600/50",
      badge: "bg-yellow-700/50 text-yellow-900 dark:bg-yellow-600/50 dark:text-yellow-100",
      barColor: "from-yellow-700 to-yellow-800",
      container: "bg-muted/20 dark:bg-zinc-800/10 rounded-lg p-2 -m-2",
    }
  }
  // Estilo por defecto
  return {
    avatar: "border-2 border-background",
    badge: "bg-muted text-muted-foreground border-border",
    barColor: "from-primary/70 to-primary",
    container: "",
  }
}

export function WaiterPerformance({ data }: WaiterPerformanceProps) {
  const sortedData = [...data].sort((a, b) => b.sales - a.sales)
  const maxSales = Math.max(...sortedData.map(d => d.sales), 1)

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Rendimiento del Personal</CardTitle>
        <CardDescription>
          Ranking basado en volumen de ventas y eficiencia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de rendimiento disponibles
            </div>
          )}
          {sortedData.map((waiter, index) => {
            const styles = getRankingStyles(index)
            const salesPercentage = (waiter.sales / maxSales) * 100
            return (
              <div key={waiter.id} className="relative">
                <div className="flex items-center justify-between mb-2">
                  {/* LEFT: Avatar, Nombre y Métricas */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {/* Avatar con Estilo Ranking */}
                      <Avatar className={cn("h-12 w-12 border-2 border-background shadow-sm", styles.avatar)}>
                        <AvatarFallback className={cn("bg-muted font-medium", styles.badge)}>
                          {waiter.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Insignia de Posición (Rank) */}
                      <div className={cn("absolute -bottom-1 -right-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border shadow-sm", styles.badge)}>
                        #{index + 1}
                      </div>
                      {/* Trofeo solo para el #1 */}
                      {index === 0 && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-1.5 shadow-xl shadow-amber-500/50">
                          <Trophy className="h-4 w-4" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-background text-[10px] font-bold px-1.5 py-0.5 rounded-full border shadow-sm">
                        #{index + 1}
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-base">{waiter.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" /> {waiter.orders} órdenes
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Ticket: {formatCurrency(waiter.averageTicket)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* RIGHT: Ventas Totales */}
                  <div className="text-right">
                    <p className="text-xs md:text-sm text-muted-foreground mb-0.5">Ventas Totales</p>
                    <p className={cn("font-extrabold text-xs md:text-md lg:text-lg", index === 0 ? "text-foreground" : "text-muted-foreground")}>{formatCurrency(waiter.sales)}</p>
                  </div>
                </div>

                {/* Sales Progress Bar */}
                <div className="mt-2 pt-1">
                  <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-1000 ease-out", `bg-gradient-to-r ${styles.barColor}`)}
                      style={{ width: `${salesPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Separador visual si no es el ultimo elemento */}
                {index < sortedData.length - 1 && <Separator />}
              </div>
            )
          })}

          {data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos de rendimiento disponibles
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
