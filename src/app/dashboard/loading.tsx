import { StatCardSkeleton, ChartSkeleton, TableSkeleton, ActivitySkeleton } from "@/components/ui/loading-skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-muted animate-pulse rounded" />
          <div className="h-5 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <ChartSkeleton height={300} />
        </div>
        <div className="col-span-3">
          <ChartSkeleton height={250} />
        </div>
      </div>

      {/* Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <TableSkeleton rows={5} />
        <TableSkeleton rows={5} />
      </div>

      {/* Recent Orders */}
      <TableSkeleton rows={10} />

      {/* Activity Feed */}
      <ActivitySkeleton items={5} />
    </div>
  )
}
