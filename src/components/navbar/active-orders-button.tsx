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
    // Refresh count every 30 seconds
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            onClick={() => router.push("/dashboard/orders")}
          >
            <ClipboardList className="h-5 w-5" />
            <span className="ml-2 hidden md:inline">Órdenes</span>
            {count > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 min-w-5 px-1 text-xs animate-bounce"
              >
                {count}
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
