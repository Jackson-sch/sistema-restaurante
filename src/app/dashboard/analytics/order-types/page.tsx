import { getOrderTypeStats } from "@/actions/order-type-stats"
import { OrderTypeMetrics } from "@/components/analytics/order-type-metrics"
import { OrderTypeBreakdownChart } from "@/components/analytics/order-type-breakdown-chart"
import { TopProductsByType } from "@/components/analytics/top-products-by-type"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function OrderTypeAnalyticsPage() {
  const result = await getOrderTypeStats()

  if (!result.success || !result.data) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Análisis por Tipo de Orden</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No hay datos disponibles</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { byType, totalSales, totalOrders } = result.data

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análisis por Tipo de Orden</h2>
          <p className="text-muted-foreground">
            Rendimiento de DINE_IN, TAKEOUT y DELIVERY
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              S/. {totalSales.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              Órdenes completadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics by Type */}
      <OrderTypeMetrics data={byType} />

      {/* Charts and Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <OrderTypeBreakdownChart data={byType} />
        <TopProductsByType data={byType} />
      </div>
    </div>
  )
}
