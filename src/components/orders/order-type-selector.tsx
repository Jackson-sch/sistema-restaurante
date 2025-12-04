"use client"

import { UtensilsCrossed, ShoppingBag, Bike } from "lucide-react"
import { cn } from "@/lib/utils"

export type OrderType = 'DINE_IN' | 'TAKEOUT' | 'DELIVERY'

interface OrderTypeSelectorProps {
  value: OrderType
  onChange: (type: OrderType) => void
}

const orderTypes = [
  {
    value: 'DINE_IN' as OrderType,
    label: 'Para Comer Aquí',
    icon: UtensilsCrossed,
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20',
    activeColor: 'bg-emerald-500 text-white border-emerald-600'
  },
  {
    value: 'TAKEOUT' as OrderType,
    label: 'Para Llevar',
    icon: ShoppingBag,
    color: 'bg-orange-500/10 text-orange-700 border-orange-200 hover:bg-orange-500/20',
    activeColor: 'bg-orange-500 text-white border-orange-600'
  },
  {
    value: 'DELIVERY' as OrderType,
    label: 'Delivery',
    icon: Bike,
    color: 'bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20',
    activeColor: 'bg-blue-500 text-white border-blue-600'
  }
]

export function OrderTypeSelector({ value, onChange }: OrderTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Tipo de Pedido</label>
      <div className="grid grid-cols-3 gap-2">
        {orderTypes.map((type) => {
          const Icon = type.icon
          const isActive = value === type.value

          return (
            <button
              key={type.value}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('OrderTypeSelector: Button clicked for', type.value, 'current value:', value)
                onChange(type.value)
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all cursor-pointer",
                isActive ? type.activeColor : type.color
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-medium text-center">
                {type.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
