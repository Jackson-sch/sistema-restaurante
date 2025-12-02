import { getDashboardStats } from "@/actions/dashboard"
import { StatCard } from "@/components/dashboard/stat-card"
import { DateRangeFilter } from "@/components/dashboard/date-range-filter"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { BarChart } from "@/components/dashboard/charts/bar-chart"
import { DonutChart } from "@/components/dashboard/charts/donut-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, ShoppingCart, Users, AlertTriangle, Clock, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"

interface PageProps {
  searchParams: Promise<{
    from?: string
    to?: string
  }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams

  // Parse dates as local timezone (not UTC)
  const parseLocalDate = (dateStr: string) => {
    // dateStr format: "2025-11-27T00:00:00.000"
    const [datePart, timePart] = dateStr.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [time, ms] = timePart.split('.')
    const [hours, minutes, seconds] = time.split(':').map(Number)

    return new Date(year, month - 1, day, hours, minutes, seconds, Number(ms))
  }

  const from = params.from ? parseLocalDate(params.from) : undefined
  const to = params.to ? parseLocalDate(params.to) : undefined

  const dateRange = from && to ? { from, to } : undefined
  const result = await getDashboardStats(dateRange)

  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Error al cargar estadísticas</p>
      </div>
    )
  }

  const stats = result.data

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING: { label: "Pendiente", variant: "secondary" },
      CONFIRMED: { label: "Confirmado", variant: "default" },
      PREPARING: { label: "Preparando", variant: "default" },
      READY: { label: "Listo", variant: "default" },
      SERVED: { label: "Servido", variant: "default" },
      COMPLETED: { label: "Completado", variant: "outline" },
      CANCELLED: { label: "Cancelado", variant: "destructive" },
    }
    const config = statusConfig[status] || { label: status, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Prepare chart data
  const salesChartData = stats.salesByDay.map(day => ({
    name: format(new Date(day.date + 'T00:00:00'), "dd MMM", { locale: es }),
    value: day.total,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Resumen de actividad y métricas clave
          </p>
        </div>
        <DateRangeFilter />
      </div>

      {/* Alerts Panel */}
      <AlertsPanel alerts={stats.alerts || []} />

      {/* Main Stats Grid */}
      < div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" >
        <StatCard
          title="Ventas Totales"
          value={formatCurrency(stats.sales.current)}
          description={`${stats.orders.current} órdenes`}
          icon={DollarSign}
          comparison={stats.sales.change}
          iconColor="text-green-600"
          iconBgColor="bg-green-100 dark:bg-green-900/30"
        />
        <StatCard
          title="Ticket Promedio"
          value={formatCurrency(stats.averageTicket.current)}
          description="Por orden completada"
          icon={TrendingUp}
          comparison={stats.averageTicket.change}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
        />
        <StatCard
          title="Tiempo Promedio"
          value={`${stats.averageTime} min`}
          description="De atención por orden"
          icon={Clock}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
        />
        <StatCard
          title="Órdenes Activas"
          value={stats.activeOrders}
          description="En proceso ahora"
          icon={ShoppingCart}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100 dark:bg-orange-900/30"
        />
      </div >

      {/* Secondary Stats */}
      < div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" >
        <StatCard
          title="Mesas Ocupadas"
          value={`${stats.occupiedTables}/${stats.totalTables}`}
          description={`${Math.round((stats.occupiedTables / stats.totalTables) * 100)}% ocupación`}
          icon={Users}
          iconColor="text-cyan-600"
          iconBgColor="bg-cyan-100 dark:bg-cyan-900/30"
        />
        <StatCard
          title="Stock Bajo"
          value={stats.lowStockCount}
          description={stats.lowStockCount > 0 ? "Requieren atención" : "Todo en orden"}
          icon={AlertTriangle}
          className={stats.lowStockCount > 0 ? "border-orange-500" : ""}
          iconColor={stats.lowStockCount > 0 ? "text-orange-600" : "text-green-600"}
          iconBgColor={stats.lowStockCount > 0 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-green-100 dark:bg-green-900/30"}
        />
        <StatCard
          title="Órdenes Completadas"
          value={stats.orders.current}
          description="En el período"
          icon={ShoppingCart}
          comparison={stats.orders.change}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100 dark:bg-indigo-900/30"
        />
      </div >

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Sales Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Tendencia de Ventas</CardTitle>
            <CardDescription>
              Ventas diarias en el período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={salesChartData} height={300} />
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ventas por Categoría</CardTitle>
            <CardDescription>
              Distribución de ingresos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.salesByCategory.length > 0 ? (
              <DonutChart data={stats.salesByCategory} height={300} />
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No hay datos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Más Vendidos</CardTitle>
            <CardDescription>
              Top 5 en el período seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topProducts.map((product, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantity} vendidos · {product.orders} órdenes
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))}
              {stats.topProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay datos de ventas
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader>
            <CardTitle>Ingredientes con Stock Bajo</CardTitle>
            <CardDescription>
              Requieren reabastecimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Mínimo: {item.minStock} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${item.currentStock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                      {item.currentStock} {item.unit}
                    </p>
                    {item.currentStock === 0 && (
                      <Badge variant="destructive" className="text-xs mt-1">Agotado</Badge>
                    )}
                  </div>
                </div>
              ))}
              {stats.lowStockItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  ✓ Todo el stock está en niveles óptimos
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
          <CardDescription>
            Últimas 10 órdenes en el período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {order.orderNumber}
                    {order.table && (
                      <span className="ml-2 text-muted-foreground">
                        · Mesa {order.table.number}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                    <p className="text-sm text-muted-foreground">{
                      order.type === 'DINE_IN' ? 'Mesa' : order.type === 'TAKEOUT' ? 'Para llevar' : 'Delivery'
                    }</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            ))}
            {stats.recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay órdenes en este período
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div >
  )
}
