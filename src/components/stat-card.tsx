import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Banknote, CreditCard, LucideIcon, Smartphone } from "lucide-react"
import { ComparisonBadge } from "@/components/dashboard/comparison-badge"

interface StatCardProps {
  title: string
  description?: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  className?: string
  comparison?: number
  cashSales?: string
  cardSales?: string
  otherSales?: string
}

export default function StatCard({
  title,
  description,
  value,
  icon: Icon,
  iconColor = "text-muted-foreground",
  iconBgColor,
  className = "",
  comparison,
  cashSales,
  cardSales,
  otherSales,
}: StatCardProps) {
  return (
    <Card className={cn("border-border/50 hover:shadow-lg transition-shadow",
      // light styles
      "bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
      // dark styles
      "dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {iconBgColor ? (
          <div className={cn("p-2 rounded-lg", iconBgColor)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
        ) : (
          <Icon className={cn("h-4 w-4", iconColor)} />
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-lg md:text-3xl font-bold", iconColor)}>
          {value} 
        </div>
        <div className="flex items-center gap-2 mt-1">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {comparison !== undefined && (
            <ComparisonBadge value={comparison} />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {cashSales !== undefined && (
              <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                <Banknote className="h-3 w-3" />{cashSales}</span>
            )}
            {cardSales !== undefined && (
              <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                <CreditCard className="h-3 w-3" />{cardSales}</span>
            )}
            {otherSales !== undefined && (
              <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                <Smartphone className="h-3 w-3" />{otherSales}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Named export for compatibility
export { StatCard }