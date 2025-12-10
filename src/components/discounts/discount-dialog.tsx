"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Percent, DollarSign, Gift } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createDiscount, updateDiscount } from "@/actions/discounts"
import type { DiscountRow } from "./columns"

const discountSchema = z.object({
  code: z.string().min(2, "Código requerido").max(20),
  name: z.string().min(2, "Nombre requerido"),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_ITEM"]),
  value: z.number().min(0, "Valor debe ser positivo"),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  usageLimit: z.number().min(1).optional().nullable(),
  validFrom: z.date(),
  validUntil: z.date(),
  active: z.boolean(),
})

type DiscountFormData = z.infer<typeof discountSchema>

interface DiscountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  discount?: DiscountRow | null
  onSuccess: () => void
}

const discountTypes = [
  { value: "PERCENTAGE", label: "Porcentaje", icon: Percent, suffix: "%" },
  { value: "FIXED_AMOUNT", label: "Monto fijo", icon: DollarSign, prefix: "S/" },
  { value: "FREE_ITEM", label: "Item gratis", icon: Gift },
]

export function DiscountDialog({
  open,
  onOpenChange,
  discount,
  onSuccess,
}: DiscountDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!discount

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      type: "PERCENTAGE",
      value: 10,
      active: true,
    },
  })

  const selectedType = watch("type")
  const validFrom = watch("validFrom")
  const validUntil = watch("validUntil")

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (discount) {
        reset({
          code: discount.code,
          name: discount.name,
          type: discount.type as any,
          value: discount.value,
          minOrderAmount: discount.minOrderAmount,
          maxDiscount: discount.maxDiscount,
          usageLimit: discount.usageLimit,
          validFrom: new Date(discount.validFrom),
          validUntil: new Date(discount.validUntil),
          active: discount.active,
        })
      } else {
        const now = new Date()
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)

        reset({
          code: "",
          name: "",
          type: "PERCENTAGE",
          value: 10,
          minOrderAmount: null,
          maxDiscount: null,
          usageLimit: null,
          validFrom: now,
          validUntil: nextMonth,
          active: true,
        })
      }
    }
  }, [open, discount, reset])

  const onSubmit = async (data: DiscountFormData) => {
    setIsSubmitting(true)

    try {
      if (isEditing && discount) {
        const result = await updateDiscount(discount.id, {
          code: data.code,
          name: data.name,
          type: data.type,
          value: data.value,
          minOrderAmount: data.minOrderAmount || undefined,
          maxDiscount: data.maxDiscount || undefined,
          usageLimit: data.usageLimit || undefined,
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          active: data.active,
        })

        if (result.success) {
          toast.success("Descuento actualizado")
          onSuccess()
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createDiscount({
          code: data.code,
          name: data.name,
          type: data.type,
          value: data.value,
          minOrderAmount: data.minOrderAmount || undefined,
          maxDiscount: data.maxDiscount || undefined,
          usageLimit: data.usageLimit || undefined,
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          active: data.active,
        })

        if (result.success) {
          toast.success("Descuento creado")
          onSuccess()
        } else {
          toast.error(result.error)
        }
      }
    } catch (error) {
      toast.error("Error al guardar el descuento")
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeConfig = discountTypes.find(t => t.value === selectedType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Descuento" : "Nuevo Descuento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editando código ${discount?.code}`
              : "Crea un nuevo código de descuento"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Code and Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código *</Label>
              <Input
                placeholder="VERANO20"
                className="uppercase"
                {...register("code")}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="Descuento de verano"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          {/* Type and Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {discountTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor *</Label>
              <div className="relative">
                {typeConfig?.prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {typeConfig.prefix}
                  </span>
                )}
                <Input
                  type="number"
                  step="0.01"
                  className={cn(
                    typeConfig?.prefix && "pl-10",
                    typeConfig?.suffix && "pr-8"
                  )}
                  {...register("value", { valueAsNumber: true })}
                />
                {typeConfig?.suffix && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {typeConfig.suffix}
                  </span>
                )}
              </div>
              {errors.value && (
                <p className="text-sm text-destructive">{errors.value.message}</p>
              )}
            </div>
          </div>

          {/* Restrictions */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">
              Restricciones (opcional)
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Mínimo de orden</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("minOrderAmount", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descuento máx.</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Sin límite"
                  {...register("maxDiscount", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Límite de usos</Label>
                <Input
                  type="number"
                  placeholder="Ilimitado"
                  {...register("usageLimit", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Válido desde *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !validFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validFrom ? format(validFrom, "d MMM yyyy", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={validFrom}
                    onSelect={(date) => date && setValue("validFrom", date)}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Válido hasta *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !validUntil && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validUntil ? format(validUntil, "d MMM yyyy", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={validUntil}
                    onSelect={(date) => date && setValue("validUntil", date)}
                    disabled={(date) => validFrom ? date < validFrom : false}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Activo</Label>
              <p className="text-sm text-muted-foreground">
                Solo códigos activos pueden ser utilizados
              </p>
            </div>
            <Switch
              checked={watch("active")}
              onCheckedChange={(checked) => setValue("active", checked)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Descuento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
