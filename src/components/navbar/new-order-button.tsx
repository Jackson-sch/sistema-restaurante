"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { NewOrderDialog } from "@/components/orders/new-order-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NewOrderButtonProps {
  categories: any[]
  products: any[]
}

export function NewOrderButton({ categories, products }: NewOrderButtonProps) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(PERMISSIONS.ORDERS_CREATE)) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <NewOrderDialog categories={categories} products={products} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Crear nuevo pedido (Ctrl+N)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
