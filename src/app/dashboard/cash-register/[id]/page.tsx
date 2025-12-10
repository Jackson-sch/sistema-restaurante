import { getShiftSummary } from "@/actions/cash-register"
import { getRestaurantSettings } from "@/actions/settings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  ArrowLeft,
  ArrowDownIcon,
  ArrowUpIcon,
  Wallet,
  Receipt,
  Banknote,
  CircleDollarSign,
  ArrowRightLeft,
  Activity,
  Clock,
  Calendar,
} from "lucide-react"
import { formatDistanceStrict } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { notFound } from "next/navigation"
import StatCard from "@/components/stat-card"
import { DenominationBreakdownDisplay } from "@/components/cash-register/denomination-breakdown-display"
import { DownloadReceiptButton } from "@/components/cash-register/download-receipt-button"
import { type DenominationInput } from "@/lib/schemas/cash-register"

interface ShiftDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ShiftDetailPage({ params }: ShiftDetailPageProps) {
  const { id } = await params
  const [shiftResult, restaurantResult] = await Promise.all([
    getShiftSummary(id),
    getRestaurantSettings()
  ])

  if (!shiftResult.success || !shiftResult.data) {
    notFound()
  }

  const shift = shiftResult.data
  const restaurant = restaurantResult.data || { name: "Restaurante" }
  const { summary, transactions } = shift
  const netFlow = summary.totalIncome - summary.totalExpenses
  const transactionCount = transactions.length

  // Calculate duration
  const duration = shift.closedAt
    ? formatDistanceStrict(new Date(shift.openedAt), new Date(shift.closedAt), { locale: es })
    : "En curso"

  // Check if has denomination breakdown
  const hasDenominations = shift.denominationBreakdown &&
    Object.values(shift.denominationBreakdown as Record<string, number>).some(v => v > 0)

  const stats = [
    {
      title: "Efectivo Final",
      value: formatCurrency(shift.closingCash ?? summary.currentCash),
      icon: Receipt,
      iconColor: "text-blue-600",
      description: "Efectivo Inicial",
      cashSales: formatCurrency(shift.openingCash),
    },
    {
      title: "Ventas Totales",
      value: formatCurrency(summary.totalSales),
      icon: Wallet,
      iconColor: "text-green-600",
      description: "",
      cashSales: formatCurrency(summary.cashSales),
      cardSales: formatCurrency(summary.cardSales),
      otherSales: formatCurrency(summary.otherSales),
    },
    {
      title: "Ingresos",
      value: formatCurrency(summary.totalIncome),
      icon: Banknote,
      iconColor: "text-green-600",
      description: "Ingresos totales",
    },
    {
      title: "Egresos",
      value: formatCurrency(summary.totalExpenses),
      icon: CircleDollarSign,
      iconColor: "text-red-600",
      description: "Egresos totales",
    },
    {
      title: "Flujo neto",
      value: formatCurrency(netFlow),
      icon: ArrowRightLeft,
      iconColor: netFlow >= 0 ? "text-green-600" : "text-red-600",
      description: "Flujo neto",
    },
    {
      title: "Movimientos",
      value: transactionCount.toString(),
      icon: Activity,
      iconColor: "text-amber-600",
      description: "Movimientos totales",
    },
  ]

  // Prepare shift data for PDF
  const shiftForPdf = {
    id: shift.id,
    turn: shift.turn,
    openingCash: shift.openingCash,
    closingCash: shift.closingCash,
    expectedCash: shift.expectedCash,
    difference: shift.difference,
    openedAt: shift.openedAt,
    closedAt: shift.closedAt,
    denominationBreakdown: shift.denominationBreakdown as DenominationInput | null,
    user: shift.user,
    summary: {
      totalSales: summary.totalSales,
      cashSales: summary.cashSales,
      cardSales: summary.cardSales,
      otherSales: summary.otherSales,
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
    },
    transactions: transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      concept: tx.concept,
      createdAt: tx.createdAt,
    })),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/cash-register/history">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Detalle del Turno
                {shift.turn && <span className="ml-2 text-muted-foreground font-normal">- {shift.turn}</span>}
              </h2>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(shift.openedAt, "dd MMM yyyy")}
                </span>
                <span className="hidden md:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(shift.openedAt, "HH:mm")}
                  {shift.closedAt && ` - ${formatDate(shift.closedAt, "HH:mm")}`}
                </span>
                <span className="hidden md:inline">•</span>
                <span>Duración: {duration}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {shift.closedAt && (
            <DownloadReceiptButton shift={shiftForPdf} restaurant={restaurant} />
          )}
          <Badge
            className={shift.closedAt
              ? "bg-muted text-muted-foreground border-0"
              : "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-0"
            }
          >
            {shift.closedAt ? "Cerrada" : "Abierta"}
          </Badge>
        </div>
      </div>

      {/* Difference alert if exists */}
      {shift.difference !== null && shift.difference !== 0 && (
        <Card className={shift.difference < 0 ? "border-red-500/50 bg-red-500/5" : "border-green-500/50 bg-green-500/5"}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${shift.difference < 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
                <CircleDollarSign className={`h-4 w-4 ${shift.difference < 0 ? "text-red-600" : "text-green-600"}`} />
              </div>
              <div>
                <p className="text-sm font-medium">Diferencia al Cierre</p>
                <p className="text-xs text-muted-foreground">
                  {shift.difference < 0 ? "Faltante de efectivo" : "Sobrante de efectivo"}
                </p>
              </div>
            </div>
            <div className={`text-xl font-bold ${shift.difference < 0 ? "text-red-600" : "text-green-600"}`}>
              {shift.difference > 0 ? "+" : ""}{formatCurrency(shift.difference)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Denomination Breakdown and Transactions */}
      <div className={`grid gap-4 ${hasDenominations ? "md:grid-cols-2" : ""}`}>
        {/* Denomination Breakdown */}
        {hasDenominations && (
          <DenominationBreakdownDisplay
            denominations={shift.denominationBreakdown as DenominationInput}
          />
        )}

        {/* Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Movimientos del Turno</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
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
                        <span>{formatDate(tx.createdAt, "p")}</span>
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
                  No hubo movimientos manuales en este turno.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
