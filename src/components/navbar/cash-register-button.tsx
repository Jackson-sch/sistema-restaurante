"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign } from "lucide-react"
import { getCashRegisterStatus } from "@/actions/quick-actions"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { CashRegisterDialog } from "./cash-register-dialog"

export function CashRegisterButton() {
  const { hasPermission } = usePermissions()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)

  const fetchStatus = async () => {
    const result = await getCashRegisterStatus()
    if (result.success) {
      setIsOpen(result.isOpen)
      setCurrentSession(result.session)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
    // Refresh status every 60 seconds
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!hasPermission(PERMISSIONS.CASH_REGISTER_VIEW)) {
    return null
  }

  const handleClick = () => {
    setDialogOpen(true)
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={handleClick}
            >
              <DollarSign className="h-5 w-5" />
              <span className="ml-2 hidden md:inline">Caja</span>
              {/* Small dot indicator for mobile */}
              <span
                className={`ml-1 md:hidden h-2 w-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
              />
              {/* Full badge for desktop */}
              <Badge
                variant={isOpen ? "default" : "secondary"}
                className="ml-2 h-5 px-2 text-xs hidden md:inline-flex"
              >
                {isOpen ? "Abierta" : "Cerrada"}
              </Badge>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Caja {isOpen ? 'abierta' : 'cerrada'} - Click para {isOpen ? 'cerrar' : 'abrir'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CashRegisterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={isOpen ? "close" : "open"}
        currentSession={currentSession}
        onSuccess={fetchStatus}
      />
    </>
  )
}
