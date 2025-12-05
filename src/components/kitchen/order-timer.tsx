"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { getElapsedTime } from "@/lib/utils"

interface OrderTimerProps {
  createdAt: Date
}

export function OrderTimer({ createdAt }: OrderTimerProps) {
  const [elapsed, setElapsed] = useState(getElapsedTime(createdAt))

  // Actualizar cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(getElapsedTime(createdAt))
    }, 1000)

    return () => clearInterval(interval)
  }, [createdAt])

  // Determinar color basado en tiempo transcurrido
  const getUrgencyStyles = () => {
    const { totalMinutes } = elapsed

    if (totalMinutes < 10) {
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: "text-emerald-600",
        pulse: false
      }
    } else if (totalMinutes < 20) {
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "text-amber-600",
        pulse: false
      }
    } else {
      return {
        badge: "bg-red-50 text-red-700 border-red-200",
        icon: "text-red-600",
        pulse: true
      }
    }
  }

  const styles = getUrgencyStyles()

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium text-sm transition-all",
        styles.badge
      )}
    >
      <Clock
        className={cn(
          "h-3.5 w-3.5",
          styles.icon,
          styles.pulse && "animate-pulse"
        )}
      />
      <span className="tabular-nums">{elapsed.formatted}</span>
    </div>
  )
}
