import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface ComparisonBadgeProps {
  value: number
  className?: string
}

export function ComparisonBadge({ value, className }: ComparisonBadgeProps) {
  const isPositive = value > 0
  const isNeutral = value === 0

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isNeutral && "bg-muted text-muted-foreground",
        isPositive && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        !isPositive && !isNeutral && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>
        {isPositive && "+"}{Math.abs(value).toFixed(1)}%
      </span>
    </div>
  )
}
