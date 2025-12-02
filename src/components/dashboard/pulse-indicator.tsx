"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface PulseIndicatorProps {
  variant?: "critical" | "warning" | "success"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PulseIndicator({ variant = "critical", size = "md", className }: PulseIndicatorProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }

  const colorClasses = {
    critical: "bg-red-500",
    warning: "bg-orange-500",
    success: "bg-green-500",
  }

  if (!mounted) return null

  return (
    <div className={cn("relative inline-flex", className)}>
      <span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
          colorClasses[variant]
        )}
        style={{ animationDuration: "2s" }}
      />
      <span className={cn("relative inline-flex rounded-full", sizeClasses[size], colorClasses[variant])} />
    </div>
  )
}
