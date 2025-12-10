"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getTables } from "@/actions/tables"
import { TableDialog } from "@/components/tables/table-dialog"
import { TableCard } from "@/components/tables/table-card"
import { NewOrderDialog } from "@/components/orders/new-order-dialog"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Table } from "@prisma/client"

type TableWithRelations = NonNullable<Awaited<ReturnType<typeof getTables>>["data"]>[number]

interface TablesViewProps {
    categories?: any[]
    products?: any[]
}

export function TablesView({ categories = [], products = [] }: TablesViewProps) {
    const router = useRouter()
    const [tables, setTables] = useState<TableWithRelations[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
    const [quickOrderOpen, setQuickOrderOpen] = useState(false)
    const [selectedTable, setSelectedTable] = useState<Table | null>(null)

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

    const handleQuickOrder = (table: Table) => {
        setSelectedTable(table)
        setQuickOrderOpen(true)
    }

    const handleOrderCreated = () => {
        setQuickOrderOpen(false)
        setSelectedTable(null)
        router.refresh()
        fetchTables()
    }

    const handleRefresh = () => {
        router.refresh()
        fetchTables(true)
    }

    // Initial load only
    useEffect(() => {
        fetchTables()
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
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                    <TableDialog onSuccess={() => {
                        router.refresh()
                        fetchTables()
                    }} />
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
                            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-5">
                                {zoneTables.map((table) => (
                                    <TableCard
                                        key={table.id}
                                        table={table as any}
                                        onUpdate={() => {
                                            router.refresh()
                                            fetchTables()
                                        }}
                                        onQuickOrder={categories.length > 0 && products.length > 0 ? handleQuickOrder : undefined}
                                    />
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
                Última actualización: {lastUpdate.toLocaleTimeString()}
            </div>

            {/* Quick Order Dialog */}
            {categories.length > 0 && products.length > 0 && selectedTable && (
                <NewOrderDialog
                    categories={categories}
                    products={products}
                    buttonSize="lg"
                    buttonVariant="default"
                    showLabel={false}
                    preselectedTable={{ id: selectedTable.id, number: selectedTable.number }}
                    isOpen={quickOrderOpen}
                    onOpenChange={(open) => {
                        setQuickOrderOpen(open)
                        if (!open) {
                            setSelectedTable(null)
                        }
                    }}
                    onSuccess={handleOrderCreated}
                />
            )}
        </div>
    )
}
