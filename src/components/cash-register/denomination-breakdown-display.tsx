"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Banknote, Coins } from "lucide-react"
import { DENOMINATIONS, type DenominationInput } from "@/lib/schemas/cash-register"
import { formatCurrency } from "@/lib/utils"

interface DenominationBreakdownDisplayProps {
  denominations: DenominationInput
  className?: string
}

export function DenominationBreakdownDisplay({ denominations, className }: DenominationBreakdownDisplayProps) {
  const bills = DENOMINATIONS.filter(d => d.type === "bill")
  const coins = DENOMINATIONS.filter(d => d.type === "coin")

  const getCount = (key: keyof DenominationInput) => denominations[key] || 0
  const getSubtotal = (key: keyof DenominationInput, value: number) => (denominations[key] || 0) * value

  const totalBills = bills.reduce((sum, d) => sum + getSubtotal(d.key, d.value), 0)
  const totalCoins = coins.reduce((sum, d) => sum + getSubtotal(d.key, d.value), 0)
  const grandTotal = totalBills + totalCoins

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Banknote className="h-4 w-4" />
          Desglose de Arqueo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Billetes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Banknote className="h-3.5 w-3.5" />
            Billetes
          </div>
          <div className="grid grid-cols-3 gap-2">
            {bills.map(denom => {
              const count = getCount(denom.key)
              const subtotal = getSubtotal(denom.key, denom.value)
              return (
                <div
                  key={denom.key}
                  className={`p-2 rounded-lg border text-center ${count > 0 ? "bg-green-500/10 border-green-500/30" : "bg-muted/50"
                    }`}
                >
                  <div className="text-xs text-muted-foreground">{denom.label}</div>
                  <div className="font-bold tabular-nums">{count}</div>
                  {count > 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      {formatCurrency(subtotal)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-sm pt-1 border-t">
            <span className="text-muted-foreground">Subtotal Billetes:</span>
            <span className="font-bold">{formatCurrency(totalBills)}</span>
          </div>
        </div>

        {/* Monedas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Coins className="h-3.5 w-3.5" />
            Monedas
          </div>
          <div className="grid grid-cols-3 gap-2">
            {coins.map(denom => {
              const count = getCount(denom.key)
              const subtotal = getSubtotal(denom.key, denom.value)
              return (
                <div
                  key={denom.key}
                  className={`p-2 rounded-lg border text-center ${count > 0 ? "bg-blue-500/10 border-blue-500/30" : "bg-muted/50"
                    }`}
                >
                  <div className="text-xs text-muted-foreground">{denom.label}</div>
                  <div className="font-bold tabular-nums">{count}</div>
                  {count > 0 && (
                    <div className="text-xs text-blue-600 font-medium">
                      {formatCurrency(subtotal)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-sm pt-1 border-t">
            <span className="text-muted-foreground">Subtotal Monedas:</span>
            <span className="font-bold">{formatCurrency(totalCoins)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-3 border-t-2">
          <span className="font-medium">Total Contado:</span>
          <Badge variant="default" className="text-base px-3 py-1">
            {formatCurrency(grandTotal)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
