"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OrderType } from "./order-type-selector"

export interface CustomerInfo {
  name: string
  phone: string
  email?: string
  deliveryAddress?: string
}

interface CustomerInfoFormProps {
  orderType: OrderType
  value: CustomerInfo
  onChange: (info: CustomerInfo) => void
  errors?: Partial<Record<keyof CustomerInfo, string>>
}

export function CustomerInfoForm({ orderType, value, onChange, errors }: CustomerInfoFormProps) {
  // Don't show for DINE_IN
  if (orderType === 'DINE_IN') {
    return null
  }

  const handleChange = (field: keyof CustomerInfo, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue
    })
  }

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
      <h3 className="font-medium text-sm">Información del Cliente</h3>

      <div className="space-y-3">
        {/* Nombre */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-name">
            Nombre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customer-name"
            placeholder="Nombre completo"
            value={value.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={errors?.name ? 'border-red-500' : ''}
          />
          {errors?.name && (
            <p className="text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Teléfono */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-phone">
            Teléfono <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customer-phone"
            type="tel"
            placeholder="999 999 999"
            value={value.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={errors?.phone ? 'border-red-500' : ''}
          />
          {errors?.phone && (
            <p className="text-xs text-red-500">{errors.phone}</p>
          )}
        </div>

        {/* Email (opcional) */}
        <div className="space-y-1.5">
          <Label htmlFor="customer-email">Email (opcional)</Label>
          <Input
            id="customer-email"
            type="email"
            placeholder="cliente@ejemplo.com"
            value={value.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>

        {/* Dirección de entrega (solo para DELIVERY) */}
        {orderType === 'DELIVERY' && (
          <div className="space-y-1.5">
            <Label htmlFor="delivery-address">
              Dirección de Entrega <span className="text-red-500">*</span>
            </Label>
            <Input
              id="delivery-address"
              placeholder="Calle, número, distrito"
              value={value.deliveryAddress || ''}
              onChange={(e) => handleChange('deliveryAddress', e.target.value)}
              className={errors?.deliveryAddress ? 'border-red-500' : ''}
            />
            {errors?.deliveryAddress && (
              <p className="text-xs text-red-500">{errors.deliveryAddress}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
