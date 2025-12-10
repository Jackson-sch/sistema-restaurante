import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ComparisonBadge } from "@/components/dashboard/comparison-badge"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  comparison?: number
  className?: string
  iconColor?: string
  iconBgColor?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  comparison,
  className,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100 dark:bg-blue-900/30"
}: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", 
      // light styles
      "bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
      // dark styles
      "dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]", 
      className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", iconBgColor)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {comparison !== undefined && (
            <ComparisonBadge value={comparison} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
