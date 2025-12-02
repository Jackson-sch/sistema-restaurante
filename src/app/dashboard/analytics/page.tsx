import { getAnalyticsData } from "@/actions/analytics"
import { DateRangeFilter } from "@/components/dashboard/date-range-filter"
import { WeeklyComparisonChart } from "@/components/analytics/weekly-comparison-chart"
import { PeakHoursHeatmap } from "@/components/analytics/peak-hours-heatmap"
import { CategoryBreakdown } from "@/components/analytics/category-breakdown"
import { WaiterPerformance } from "@/components/analytics/waiter-performance"
import { DashboardGrid } from "@/components/dashboard/dashboard-grid"
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

  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Error al cargar datos analíticos</p>
      </div>
    )
  }

  const { weeklyComparison, peakHours, categoryPerformance, waiterPerformance } = result.data

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analítica Avanzada</h2>
          <p className="text-muted-foreground">
            Tendencias, rendimiento y proyecciones
          </p>
        </div>
        <DateRangeFilter />
      </div>

      <DashboardGrid className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Weekly Comparison - Full Width */}
        <AnimatedCard delay={0.1} className="col-span-4">
          <WeeklyComparisonChart data={weeklyComparison} />
        </AnimatedCard>

        {/* Peak Hours & Categories - Split */}
        <AnimatedCard delay={0.2} className="col-span-4 lg:col-span-2 h-full">
          <PeakHoursHeatmap data={peakHours} />
        </AnimatedCard>

        <AnimatedCard delay={0.3} className="col-span-4 lg:col-span-2 h-full">
          <CategoryBreakdown data={categoryPerformance} />
        </AnimatedCard>

        {/* Waiter Performance - Full Width */}
        <AnimatedCard delay={0.4} className="col-span-4">
          <WaiterPerformance data={waiterPerformance} />
        </AnimatedCard>
      </DashboardGrid>
    </div>
  )
}
