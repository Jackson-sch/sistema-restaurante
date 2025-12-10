"use client"

import { formatCurrency } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReconciliationSummaryProps {
  expectedCash: number
  countedCash: number
  openingCash: number
  totalSales: number
  cashSales: number
  totalIncome: number
  totalExpenses: number
}

export function ReconciliationSummary({
  expectedCash,
  countedCash,
  openingCash,
  totalSales,
  cashSales,
  totalIncome,
  totalExpenses
}: ReconciliationSummaryProps) {
  const difference = countedCash - expectedCash
  const isBalanced = difference === 0
  const isPositive = difference > 0
  const isNegative = difference < 0

  const getStatusIcon = () => {
    if (isBalanced) return <CheckCircle2 className="h-6 w-6 text-green-500" />
    if (Math.abs(difference) <= 5) return <AlertTriangle className="h-6 w-6 text-amber-500" />
    return <XCircle className="h-6 w-6 text-red-500" />
  }

  const getStatusText = () => {
    if (isBalanced) return "Caja cuadrada"
    if (isPositive) return "Sobrante en caja"
    return "Faltante en caja"
  }

  const getStatusColor = () => {
    if (isBalanced) return "bg-green-500/10 border-green-500/30 text-green-600"
    if (isPositive) return "bg-blue-500/10 border-blue-500/30 text-blue-600"
    return "bg-red-500/10 border-red-500/30 text-red-600"
  }

  return (
    <div className="space-y-4">
      {/* Resumen del turno */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-muted-foreground">Efectivo Inicial</p>
          <p className="text-lg font-semibold">{formatCurrency(openingCash)}</p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-muted-foreground">Ventas en Efectivo</p>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(cashSales)}</p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Ingresos Manuales
          </p>
          <p className="text-lg font-semibold text-green-600">+{formatCurrency(totalIncome)}</p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            Egresos
          </p>
          <p className="text-lg font-semibold text-red-600">-{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {/* Comparación esperado vs contado */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-2">
          <div className="p-4 bg-muted/50 border-r">
            <p className="text-sm text-muted-foreground mb-1">Esperado (Sistema)</p>
            <p className="text-2xl font-bold">{formatCurrency(expectedCash)}</p>
          </div>
          <div className="p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Contado (Real)</p>
            <p className="text-2xl font-bold">{formatCurrency(countedCash)}</p>
          </div>
        </div>

        {/* Resultado del arqueo */}
        <div className={cn(
          "p-4 border-t flex items-center justify-between",
          getStatusColor()
        )}>
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-semibold">{getStatusText()}</p>
              <p className="text-sm opacity-80">
                {isBalanced
                  ? "El efectivo físico coincide con el sistema"
                  : isPositive
                    ? "Hay más efectivo del esperado"
                    : "Hay menos efectivo del esperado"
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {difference > 0 ? "+" : ""}{formatCurrency(difference)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
