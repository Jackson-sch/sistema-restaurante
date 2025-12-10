"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { DENOMINATIONS, type DenominationInput, calculateTotalFromDenominations } from "@/lib/schemas/cash-register"
import { Banknote, Coins } from "lucide-react"

interface DenominationCounterProps {
  value: DenominationInput
  onChange: (value: DenominationInput) => void
}

export function DenominationCounter({ value, onChange }: DenominationCounterProps) {
  const total = calculateTotalFromDenominations(value)

  const handleChange = (key: keyof DenominationInput, count: number) => {
    onChange({
      ...value,
      [key]: Math.max(0, count)
    })
  }

  const bills = DENOMINATIONS.filter(d => d.type === "bill")
  const coins = DENOMINATIONS.filter(d => d.type === "coin")

  return (
    <div className="space-y-4">
      {/* Billetes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Banknote className="h-4 w-4" />
          <span>Billetes</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {bills.map((denom) => {
            const count = value[denom.key] || 0
            const subtotal = count * denom.value
            return (
              <div key={denom.key} className="space-y-1">
                <Label className="text-xs font-medium">{denom.label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={count}
                    onChange={(e) => handleChange(denom.key, parseInt(e.target.value) || 0)}
                    className="h-9 text-center"
                  />
                </div>
                {count > 0 && (
                  <p className="text-xs text-muted-foreground text-right">
                    = {formatCurrency(subtotal)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Monedas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Coins className="h-4 w-4" />
          <span>Monedas</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {coins.map((denom) => {
            const count = value[denom.key] || 0
            const subtotal = count * denom.value
            return (
              <div key={denom.key} className="space-y-1">
                <Label className="text-xs font-medium">{denom.label}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={count}
                    onChange={(e) => handleChange(denom.key, parseInt(e.target.value) || 0)}
                    className="h-9 text-center"
                  />
                </div>
                {count > 0 && (
                  <p className="text-xs text-muted-foreground text-right">
                    = {formatCurrency(subtotal)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
        <span className="font-medium">Total Contado:</span>
        <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
