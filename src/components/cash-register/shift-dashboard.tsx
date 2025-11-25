"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { TransactionDialog } from "./transaction-dialog"
import { CloseShiftDialog } from "./close-shift-dialog"
import {
    ArrowDownIcon,
    ArrowUpIcon,
    Wallet,
    TrendingUp,
    Clock,
    Receipt,
    CreditCard,
    Banknote,
    CircleDollarSign,
    ArrowRightLeft,
    ChevronRight,
    Activity,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface Transaction {
    id: string
    type: "INCOME" | "EXPENSE"
    amount: number
    concept: string
    reference?: string
    createdAt: string
}

interface ShiftSummary {
    currentCash: number
    totalSales: number
    cashSales: number
    cardSales: number
    totalIncome: number
    totalExpenses: number
    initialCash: number
}

interface ShiftDashboardProps {
    shift: {
        id: string
        openedAt: string
        turn?: string | null
        summary: ShiftSummary
        transactions: Transaction[]
    }
}

export function ShiftDashboard({ shift }: ShiftDashboardProps) {
    const { summary, transactions } = shift
    const [elapsedTime, setElapsedTime] = useState("")

    // Update elapsed time every minute
    useEffect(() => {
        const updateElapsed = () => {
            setElapsedTime(
                formatDistanceToNow(new Date(shift.openedAt), {
                    locale: es,
                    addSuffix: false,
                }),
            )
        }
        updateElapsed()
        const interval = setInterval(updateElapsed, 60000)
        return () => clearInterval(interval)
    }, [shift.openedAt])

    const netFlow = summary.totalIncome - summary.totalExpenses
    const transactionCount = transactions.length

    return (
        <div className="space-y-6">
            {/* Header with status */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">
                            Caja Registradora
                            {shift.turn && <span className="ml-2 text-muted-foreground font-normal">- Turno {shift.turn}</span>}
                        </h2>
                        <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-0">
                            <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Abierta
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Abierta hace {elapsedTime}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:flex items-center gap-1.5">
                            <Receipt className="h-3.5 w-3.5" />
                            {transactionCount} movimiento{transactionCount !== 1 ? "s" : ""}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <TransactionDialog cashRegisterId={shift.id} />
                    <CloseShiftDialog cashRegisterId={shift.id} expectedCash={summary.currentCash} />
                </div>
            </div>

            {/* Main stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Cash in register - Primary card */}
                <Card className="relative overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 to-background dark:border-emerald-900 dark:from-emerald-950/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                            Efectivo en Caja
                        </CardTitle>
                        <div className="rounded-full bg-emerald-500/10 p-2">
                            <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(summary.currentCash)}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="rounded bg-muted px-1.5 py-0.5">
                                Inicial: {formatCurrency(summary.initialCash || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Total sales */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                        <div className="rounded-full bg-blue-500/10 p-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5">
                                <Banknote className="h-3 w-3" />
                                {formatCurrency(summary.cashSales)}
                            </span>
                            <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5">
                                <CreditCard className="h-3 w-3" />
                                {formatCurrency(summary.cardSales || 0)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Income */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                        <div className="rounded-full bg-green-500/10 p-2">
                            <ArrowUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            +{formatCurrency(summary.totalIncome)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Depósitos y ajustes positivos</p>
                    </CardContent>
                </Card>

                {/* Expenses */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Egresos</CardTitle>
                        <div className="rounded-full bg-red-500/10 p-2">
                            <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            -{formatCurrency(summary.totalExpenses)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Retiros y gastos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Net flow indicator */}
            {(summary.totalIncome > 0 || summary.totalExpenses > 0) && (
                <Card className="border-dashed">
                    <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-muted p-2">
                                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Flujo Neto de Movimientos</p>
                                <p className="text-xs text-muted-foreground">Diferencia entre ingresos y egresos manuales</p>
                            </div>
                        </div>
                        <div
                            className={`text-xl font-bold ${netFlow >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                }`}
                        >
                            {netFlow >= 0 ? "+" : ""}
                            {formatCurrency(netFlow)}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent transactions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>Movimientos Recientes</CardTitle>
                    </div>
                    {transactions.length > 5 && (
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                            Ver todos
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.slice(0, 5).map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                >
                                    <div
                                        className={`rounded-full p-2 ${tx.type === "INCOME"
                                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                                            }`}
                                    >
                                        {tx.type === "INCOME" ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{tx.concept}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{format(new Date(tx.createdAt), "p", { locale: es })}</span>
                                            {tx.reference && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate">Ref: {tx.reference}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div
                                        className={`text-right font-bold tabular-nums ${tx.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                            }`}
                                    >
                                        {tx.type === "INCOME" ? "+" : "-"}
                                        {formatCurrency(tx.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <CircleDollarSign className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium">Sin movimientos</h3>
                            <p className="mt-1 text-sm text-muted-foreground max-w-[200px]">
                                No hay movimientos registrados en este turno todavía.
                            </p>
                            <TransactionDialog
                                cashRegisterId={shift.id}
                                trigger={
                                    <Button variant="outline" size="sm" className="mt-4 bg-transparent">
                                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                                        Registrar movimiento
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
