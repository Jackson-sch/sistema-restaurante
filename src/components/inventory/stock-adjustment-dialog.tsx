"use client"

import { useState, useTransition } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { adjustStock } from "@/actions/inventory"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  type: z.enum(["IN", "OUT", "WASTE", "ADJUSTMENT"] as const),
  quantity: z.coerce.number().min(0.001, "La cantidad debe ser mayor a 0"),
  reason: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient: any | null
}

export function StockAdjustmentDialog({ open, onOpenChange, ingredient }: StockAdjustmentDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: "IN",
      quantity: 0,
      reason: "",
    },
  })

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!ingredient) return

    startTransition(async () => {
      const result = await adjustStock(
        ingredient.id,
        values.quantity,
        values.type,
        values.reason
      )

      if (result.success) {
        toast.success("Stock actualizado correctamente")
        form.reset()
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  if (!ingredient) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajustar Stock: {ingredient.name}</DialogTitle>
          <DialogDescription>
            Registra una entrada, salida o ajuste de inventario.
            Stock actual: <strong>{Number(ingredient.currentStock)} {ingredient.unit}</strong>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Movimiento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="IN">Entrada (Compra)</SelectItem>
                      <SelectItem value="OUT">Salida (Uso)</SelectItem>
                      <SelectItem value="WASTE">Merma (Desperdicio)</SelectItem>
                      <SelectItem value="ADJUSTMENT">Ajuste (Corrección)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad ({ingredient.unit})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej. Compra semanal, Caducidad, Error de conteo"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Movimiento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
