import { ShoppingBag, DollarSign, CheckCircle, Users, Package, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { Activity, ActivityType } from "@/actions/activity"

interface ActivityItemProps {
  activity: Activity
}

const activityConfig: Record<ActivityType, {
  icon: typeof ShoppingBag
  iconColor: string
  iconBgColor: string
}> = {
  order_created: {
    icon: ShoppingBag,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  order_completed: {
    icon: CheckCircle,
    iconColor: "text-green-600 dark:text-green-400",
    iconBgColor: "bg-green-100 dark:bg-green-900/30",
  },
  payment_received: {
    icon: DollarSign,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  table_freed: {
    icon: Users,
    iconColor: "text-gray-600 dark:text-gray-400",
    iconBgColor: "bg-gray-100 dark:bg-gray-900/30",
  },
  table_occupied: {
    icon: Users,
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  stock_adjusted: {
    icon: Package,
    iconColor: "text-orange-600 dark:text-orange-400",
    iconBgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const config = activityConfig[activity.type]
  const Icon = config.icon

  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <div className={cn(
        "shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
        config.iconBgColor
      )}>
        <Icon className={cn("h-5 w-5", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          {activity.description}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDistanceToNow(activity.timestamp, {
            addSuffix: true,
            locale: es
          })}
        </p>
      </div>
    </div>
  )
}
