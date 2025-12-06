import { getAnalyticsData } from "@/actions/analytics"
import { getOrderTypeStats } from "@/actions/order-type-stats"
import { formatCurrency } from "@/lib/utils"
import { DateRangeFilter } from "@/components/dashboard/date-range-filter"
import { WeeklyComparisonChart } from "@/components/analytics/weekly-comparison-chart"
import { PeakHoursHeatmap } from "@/components/analytics/peak-hours-heatmap"
import { CategoryBreakdown } from "@/components/analytics/category-breakdown"
import { WaiterPerformance } from "@/components/analytics/waiter-performance"
import { OrderTypeMetrics } from "@/components/analytics/order-type-metrics"
import { OrderTypeBreakdownChart } from "@/components/analytics/order-type-breakdown-chart"
import { TopProductsByType } from "@/components/analytics/top-products-by-type"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
import { DashboardExportButton } from "@/components/dashboard/dashboard-export-button"
import { AnimatedCard } from "@/components/dashboard/animated-card"

interface AnalyticsPageProps {
  searchParams: Promise<{
    from?: string
    to?: string
  }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
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
  const result = await getAnalyticsData(dateRange)
  const orderTypeResult = await getOrderTypeStats(dateRange)

  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Error al cargar datos analíticos</p>
      </div>
    )
  }

  const { weeklyComparison, peakHours, categoryPerformance, waiterPerformance } = result.data
  const orderTypeData = orderTypeResult.success ? orderTypeResult.data : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analítica Avanzada</h2>
          <p className="text-muted-foreground">
            Tendencias, rendimiento y proyecciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardExportButton />
          <DateRangeFilter />
        </div>
      </div>

      <DashboardGrid className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Weekly Comparison - Full Width */}
        <div className="col-span-1 lg:col-span-2">
          <WeeklyComparisonChart data={weeklyComparison} />
        </div>

        {/* Peak Hours & Categories - Split */}
        <div className="col-span-1 h-[380px]">
          <PeakHoursHeatmap data={peakHours} />
        </div>

        <div className="col-span-1 h-[380px]">
          <CategoryBreakdown data={categoryPerformance} />
        </div>

        {/* Waiter Performance - Full Width */}
        <div className="col-span-1 lg:col-span-2">
          <WaiterPerformance data={waiterPerformance} />
        </div>

        {/* Order Type Analytics */}
        {orderTypeData && (
          <>
            <div className="col-span-1 lg:col-span-2">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">Análisis por Tipo de Orden</h3>
                  <p className="text-sm text-muted-foreground">
                    {orderTypeData.totalOrders} órdenes • {formatCurrency(orderTypeData.totalSales)}
                  </p>
                </div>
                <OrderTypeMetrics data={orderTypeData.byType} />
              </div>
            </div>

            <div className="col-span-1 h-[400px]">
              <OrderTypeBreakdownChart data={orderTypeData.byType} />
            </div>

            <div className="col-span-1 h-[400px]">
              <TopProductsByType data={orderTypeData.byType} />
            </div>
          </>
        )}
      </DashboardGrid>
    </div>
  )
}
