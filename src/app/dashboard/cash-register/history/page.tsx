import { getShiftHistory, getDifferenceStats } from "@/actions/cash-register"
import { getCashSettings } from "@/actions/settings"
import { ShiftHistoryTable } from "@/components/cash-register/shift-history-table"
import { DifferenceStatsChart } from "@/components/cash-register/difference-stats-chart"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function CashRegisterHistoryPage() {
    const [historyResult, statsResult, settingsResult] = await Promise.all([
        getShiftHistory({ limit: 100 }),
        getDifferenceStats(20),
        getCashSettings()
    ])

    const history = historyResult.data || []
    const differenceStats = statsResult.data || []
    const tolerance = settingsResult.data?.cashTolerance ?? 5

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/cash-register">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Historial de Caja</h1>
                    <p className="text-muted-foreground">
                        Registro de turnos cerrados y movimientos.
                    </p>
                </div>
            </div>

            {/* Difference Stats Chart */}
            {differenceStats.length > 0 && (
                <DifferenceStatsChart data={differenceStats} tolerance={tolerance} />
            )}

            <ShiftHistoryTable data={history || []} />
        </div>
    )
}
