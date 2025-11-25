"use client"

import { useEffect, useState } from "react"
import { getTables } from "@/actions/tables"
import { TableDialog } from "@/components/tables/table-dialog"
import { TableCard } from "@/components/tables/table-card"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type TableWithRelations = NonNullable<Awaited<ReturnType<typeof getTables>>["data"]>[number]

export function TablesView() {
    const [tables, setTables] = useState<TableWithRelations[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const fetchTables = async (showToast = false) => {
        setIsRefreshing(true)
        try {
            const result = await getTables()
            if (result.success && result.data) {
                setTables(result.data)
                setLastUpdate(new Date())
                if (showToast) {
                    toast.success("Mesas actualizadas")
                }
            }
        } catch (error) {
            console.error("Error fetching tables:", error)
        } finally {
            setIsRefreshing(false)
        }
    }

    // Initial load
    useEffect(() => {
        fetchTables()
    }, [])

    // Auto-refresh every 15 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchTables()
        }, 15000) // 15 seconds

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mesas</h1>
                    <p className="text-muted-foreground">
                        Gestiona las mesas y su estado en tiempo real.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTables(true)}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                    <TableDialog onSuccess={() => fetchTables()} />
                </div>
            </div>

            {tables && tables.length > 0 ? (
                <div className="space-y-8">
                    {/* Group tables by zone */}
                    {Object.entries(
                        tables.reduce((acc, table) => {
                            const zoneName = table.zone?.name || "Sin Zona"
                            if (!acc[zoneName]) acc[zoneName] = []
                            acc[zoneName].push(table)
                            return acc
                        }, {} as Record<string, TableWithRelations[]>)
                    ).sort((a, b) => {
                        if (a[0] === "Sin Zona") return 1
                        if (b[0] === "Sin Zona") return -1
                        return a[0].localeCompare(b[0])
                    }).map(([zoneName, zoneTables]) => (
                        <div key={zoneName} className="space-y-4">
                            <h2 className="text-xl font-semibold border-b pb-2">{zoneName}</h2>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {zoneTables.map((table) => (
                                    <TableCard key={table.id} table={table as any} onUpdate={() => fetchTables()} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    No hay mesas registradas. Comienza creando una.
                </div>
            )}

            <div className="text-xs text-muted-foreground text-center" suppressHydrationWarning>
                Última actualización: {lastUpdate.toLocaleTimeString()} • Auto-actualización cada 15s
            </div>
        </div>
    )
}
