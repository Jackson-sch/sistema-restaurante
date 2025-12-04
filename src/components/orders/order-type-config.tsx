"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings2 } from "lucide-react"
import { OrderTypeSelector, type OrderType } from "./order-type-selector"
import { CustomerInfoForm, type CustomerInfo } from "./customer-info-form"

interface OrderTypeConfigProps {
  orderType: OrderType
  onOrderTypeChange: (type: OrderType) => void
  customerInfo: CustomerInfo
  onCustomerInfoChange: (info: CustomerInfo) => void
}

export function OrderTypeConfig({
  orderType,
  onOrderTypeChange,
  customerInfo,
  onCustomerInfoChange,
}: OrderTypeConfigProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Configurar Tipo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Tipo de Pedido</DialogTitle>
          <DialogDescription>
            Selecciona el tipo de pedido e ingresa la información necesaria
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <OrderTypeSelector
            value={orderType}
            onChange={(type) => {
              console.log('OrderTypeConfig: onChange called with', type)
              console.log('OrderTypeConfig: onOrderTypeChange function:', onOrderTypeChange)
              onOrderTypeChange(type)
              console.log('OrderTypeConfig: After calling onOrderTypeChange')
            }}
          />

          <CustomerInfoForm
            orderType={orderType}
            value={customerInfo}
            onChange={onCustomerInfoChange}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
