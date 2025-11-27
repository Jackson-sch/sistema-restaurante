import { AlertCircle, AlertTriangle, Info, Clock, Package, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

export type AlertType = "critical" | "warning" | "info"

export interface Alert {
  id: string
  type: AlertType
  title: string
  message: string
  timestamp?: Date
  action?: {
    label: string
    href: string
  }
}

interface AlertItemProps {
  alert: Alert
  onDismiss?: (id: string) => void
}

const alertConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-900",
    iconColor: "text-red-600 dark:text-red-400",
    textColor: "text-red-900 dark:text-red-100",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-900",
    iconColor: "text-orange-600 dark:text-orange-400",
    textColor: "text-orange-900 dark:text-orange-100",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900",
    iconColor: "text-blue-600 dark:text-blue-400",
    textColor: "text-blue-900 dark:text-blue-100",
  },
}

export function AlertItem({ alert, onDismiss }: AlertItemProps) {
  const config = alertConfig[alert.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg border",
        config.bgColor,
        config.borderColor
      )}
    >
      <div className={cn("flex-shrink-0 mt-0.5", config.iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={cn("text-sm font-semibold", config.textColor)}>
          {alert.title}
        </h4>
        <p className={cn("text-sm mt-1", config.textColor, "opacity-90")}>
          {alert.message}
        </p>
        {alert.action && (
          <a
            href={alert.action.href}
            className={cn(
              "text-sm font-medium mt-2 inline-block hover:underline",
              config.iconColor
            )}
          >
            {alert.action.label} →
          </a>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(alert.id)}
          className={cn(
            "flex-shrink-0 text-sm font-medium hover:opacity-70",
            config.textColor
          )}
        >
          ✕
        </button>
      )}
    </div>
  )
}
