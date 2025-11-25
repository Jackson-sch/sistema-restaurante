import { checkOpenShift, getShiftSummary } from "@/actions/cash-register"
import { OpenShiftDialog } from "@/components/cash-register/open-shift-dialog"
import { ShiftDashboard } from "@/components/cash-register/shift-dashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { InfoIcon } from "lucide-react"
import Link from "next/link"

export default async function CashRegisterPage() {
    const { data: openShift } = await checkOpenShift()

    if (!openShift) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Caja</h1>
                        <p className="text-muted-foreground">
                            Gestión de turnos y movimientos de efectivo.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/cash-register/history">
                            Ver Historial
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-muted/10 space-y-4">
                    <div className="p-4 rounded-full bg-primary/10">
                        <InfoIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center space-y-2 max-w-sm">
                        <h2 className="text-xl font-semibold">Caja Cerrada</h2>
                        <p className="text-muted-foreground">
                            No hay un turno activo en este momento. Abre la caja para comenzar a registrar ventas y movimientos.
                        </p>
                    </div>
                    <OpenShiftDialog />
                </div>
            </div>
        )
    }

    // Fetch full summary for the open shift
    const { data: shiftSummary } = await getShiftSummary(openShift.id)

    if (!shiftSummary) {
        return <div>Error al cargar información de la caja.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Caja</h1>
                    <p className="text-muted-foreground">
                        Gestión de turnos y movimientos de efectivo.
                    </p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/dashboard/cash-register/history">
                        Ver Historial
                    </Link>
                </Button>
            </div>

            <ShiftDashboard shift={{
                ...shiftSummary,
                summary: {
                    ...shiftSummary.summary,
                    initialCash: shiftSummary.openingCash
                },
                openedAt: shiftSummary.openedAt.toISOString(),
                transactions: shiftSummary.transactions.map(tx => ({
                    ...tx,
                    type: tx.type as "INCOME" | "EXPENSE",
                    reference: tx.reference || undefined,
                    createdAt: tx.createdAt.toISOString()
                }))
            }} />
        </div>
    )
}
