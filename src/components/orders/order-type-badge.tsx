import { Badge } from "@/components/ui/badge"
import { UtensilsCrossed, ShoppingBag, Bike } from "lucide-react"

type OrderType = 'DINE_IN' | 'TAKEOUT' | 'DELIVERY'

interface OrderTypeBadgeProps {
  type: OrderType
  className?: string
}

const orderTypeConfig = {
  DINE_IN: {
    label: 'Para Comer Aquí',
    icon: UtensilsCrossed,
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20'
  },
  TAKEOUT: {
    label: 'Para Llevar',
    icon: ShoppingBag,
    className: 'bg-orange-500/10 text-orange-700 border-orange-200 hover:bg-orange-500/20'
  },
  DELIVERY: {
    label: 'Delivery',
    icon: Bike,
    className: 'bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20'
  }
}

export function OrderTypeBadge({ type, className }: OrderTypeBadgeProps) {
  const config = orderTypeConfig[type]
  const Icon = config.icon

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className} ${className || ''}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}
