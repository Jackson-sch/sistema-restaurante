"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ClipboardList } from "lucide-react"
import { useRouter } from "next/navigation"
import { getActiveOrdersCount } from "@/actions/quick-actions"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ActiveOrdersButton() {
  const router = useRouter()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCount = async () => {
    const result = await getActiveOrdersCount()
    if (result.success) {
      setCount(result.count)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCount()
    // Refresh count every 3 seconds for near real-time updates
    const interval = setInterval(fetchCount, 3000)

    // Also refresh when window becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCount()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Instant update when order is created/updated in same tab
    const handleOrderUpdate = () => fetchCount()
    window.addEventListener('order-updated', handleOrderUpdate)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('order-updated', handleOrderUpdate)
    }
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => router.push("/dashboard/orders")}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="ml-2 hidden md:inline">Órdenes</span>
            {count > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {count > 9 ? '9+' : count}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{count} {count === 1 ? 'orden activa' : 'órdenes activas'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
