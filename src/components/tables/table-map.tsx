"use client"

import { useState } from "react"
import { Table, Zone } from "@prisma/client"
import { TableMapItem } from "@/components/tables/table-map-item"
import { TableQuickActions } from "@/components/tables/table-quick-actions"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Sparkles, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"

type TableWithRelations = Table & {
  zone?: Zone | null
  orders?: Array<{
    id: string
    createdAt: Date
    status: string
    user?: {
      name: string | null
    } | null
  }>
}

interface TableMapProps {
  tables: TableWithRelations[]
  onUpdate?: () => void
}

export function TableMap({ tables, onUpdate }: TableMapProps) {
  const [selectedTable, setSelectedTable] = useState<TableWithRelations | null>(null)
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set())

  // Group tables by zone
  const tablesByZone = tables.reduce((acc, table) => {
    const zoneName = table.zone?.name || "Sin Zona"
    const zoneId = table.zone?.id || "no-zone"
    if (!acc[zoneId]) {
      acc[zoneId] = {
        name: zoneName,
        tables: [],
      }
    }
    acc[zoneId].tables.push(table)
    return acc
  }, {} as Record<string, { name: string; tables: TableWithRelations[] }>)

  // Sort zones: named zones alphabetically, "Sin Zona" last
  const sortedZones = Object.entries(tablesByZone).sort((a, b) => {
    if (a[1].name === "Sin Zona") return 1
    if (b[1].name === "Sin Zona") return -1
    return a[1].name.localeCompare(b[1].name)
  })

  const toggleZone = (zoneId: string) => {
    setCollapsedZones((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(zoneId)) {
        newSet.delete(zoneId)
      } else {
        newSet.add(zoneId)
      }
      return newSet
    })
  }

  const getZoneStats = (zoneTables: TableWithRelations[]) => {
    const available = zoneTables.filter((t) => t.status === "AVAILABLE").length
    const occupied = zoneTables.filter((t) => t.status === "OCCUPIED").length
    const reserved = zoneTables.filter((t) => t.status === "RESERVED").length

    return { available, occupied, reserved, total: zoneTables.length }
  }

  return (
    <>
      <div className="space-y-6">
        {sortedZones.map(([zoneId, zone]) => {
          const stats = getZoneStats(zone.tables)
          const isCollapsed = collapsedZones.has(zoneId)

          return (
            <Card
              key={zoneId}
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <LayoutGrid className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight">{zone.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {stats.total} {stats.total === 1 ? "mesa" : "mesas"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Stats Badges */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/40"
                      >
                        {stats.available} disponibles
                      </Badge>
                      {stats.occupied > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-blue-100/80 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300 border-blue-200/40"
                        >
                          {stats.occupied} ocupadas
                        </Badge>
                      )}
                      {stats.reserved > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-teal-100/80 dark:bg-teal-800/60 text-teal-600 dark:text-teal-300 border-teal-200/40"
                        >
                          {stats.reserved} reservadas
                        </Badge>
                      )}
                    </div>

                    {/* Collapse/Expand Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleZone(zoneId)}
                      className="gap-2"
                    >
                      {isCollapsed ? (
                        <>
                          Expandir
                          <ChevronDown className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Colapsar
                          <ChevronUp className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="pt-6">
                  {zone.tables.length > 0 ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {zone.tables.map((table) => (
                        <TableMapItem
                          key={table.id}
                          table={table}
                          onClick={() => setSelectedTable(table)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 bg-muted/50 rounded-full mb-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No hay mesas en esta zona
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}

        {sortedZones.length === 0 && (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-6 bg-muted/50 rounded-full">
                  <LayoutGrid className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">No hay mesas registradas</h3>
                  <p className="text-sm text-muted-foreground">
                    Comienza creando mesas y zonas para visualizarlas aquí
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions Sheet */}
      <TableQuickActions
        table={selectedTable}
        open={!!selectedTable}
        onOpenChange={(open: boolean) => !open && setSelectedTable(null)}
        onUpdate={() => {
          onUpdate?.()
          setSelectedTable(null)
        }}
      />
    </>
  )
}
