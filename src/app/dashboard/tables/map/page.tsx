import { getTablesWithOccupationTime } from "@/actions/tables"
import { TableMap } from "@/components/tables/table-map"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, LayoutGrid, Activity } from "lucide-react"
import Link from "next/link"
import StatCard from "@/components/stat-card"

export const dynamic = "force-dynamic"
export const revalidate = 30 // Revalidate every 30 seconds

export default async function TableMapPage() {
  const result = await getTablesWithOccupationTime()

  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Error al cargar las mesas</p>
      </div>
    )
  }

  const tables = result.data

  // Calculate statistics
  const stats = [
    {
      title: "Total de Mesas",
      value: tables.length,
      icon: LayoutGrid,
      iconColor: "text-primary",
      description: "Mesas registradas en el sistema",
      className: "bg-gradient-to-br from-background to-muted/20",
    },
    {
      title: "Disponibles",
      value: tables.filter((t) => t.status === "AVAILABLE").length,
      icon: Activity,
      iconColor: "text-slate-600",
      description: "Mesas listas para usar",
      className:
        "bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-950/20 dark:to-slate-900/10 border-slate-200/50 dark:border-slate-800/30",
    },
    {
      title: "Ocupadas",
      value: tables.filter((t) => t.status === "OCCUPIED").length,
      icon: Activity,
      iconColor: "text-blue-600",
      description: "Mesas con clientes",
      className:
        "bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-800/30",
    },
    {
      title: "Reservadas",
      value: tables.filter((t) => t.status === "RESERVED").length,
      icon: Activity,
      iconColor: "text-teal-600",
      description: "Mesas reservadas",
      className:
        "bg-gradient-to-br from-teal-50/50 to-teal-100/30 dark:from-teal-950/20 dark:to-teal-900/10 border-teal-200/50 dark:border-teal-800/30",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Mapa de Mesas</h1>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-green-500 animate-pulse">
              <Activity className="w-3.5 h-3.5 animate-ping transition-all duration-1000" />
              En Vivo
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Vista visual de todas las mesas organizadas por zonas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="default" asChild>
            <Link href="/dashboard/tables">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Vista Lista
            </Link>
          </Button>
          <form>
            <Button variant="outline" size="default" type="submit" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
          </form>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Table Map */}
      <TableMap tables={result.data as any} />

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>Actualización automática cada 15 segundos</span>
        </div>
      </div>
    </div>
  )
}
