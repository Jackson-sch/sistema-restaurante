import { getShiftHistory } from "@/actions/cash-register"
import { ShiftHistoryTable } from "@/components/cash-register/shift-history-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function CashRegisterHistoryPage() {
    const { data: history } = await getShiftHistory({ limit: 100 })

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

            <ShiftHistoryTable data={history || []} />
        </div>
    )
}
