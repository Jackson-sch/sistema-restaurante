"use client"

import { useState, useEffect, useTransition } from "react"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createIngredient, updateIngredient } from "@/actions/inventory"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  unit: z.string().min(1, "La unidad es obligatoria"),
  minStock: z.coerce.number().min(0, "El stock mínimo debe ser positivo"),
  cost: z.coerce.number().min(0, "El costo debe ser positivo"),
  currentStock: z.coerce.number().min(0, "El stock inicial debe ser positivo").optional(),
})

type FormValues = z.infer<typeof formSchema>

interface IngredientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient?: any | null
}

export function IngredientDialog({ open, onOpenChange, ingredient }: IngredientDialogProps) {
  const [isPending, startTransition] = useTransition()
  const isEditing = !!ingredient

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      unit: "kg",
      minStock: 0,
      cost: 0,
      currentStock: 0,
    },
  })

  useEffect(() => {
    if (ingredient) {
      form.reset({
        name: ingredient.name,
        unit: ingredient.unit,
        minStock: Number(ingredient.minStock),
        cost: Number(ingredient.cost),
        currentStock: Number(ingredient.currentStock),
      })
    } else {
      form.reset({
        name: "",
        unit: "kg",
        minStock: 0,
        cost: 0,
        currentStock: 0,
      })
    }
  }, [ingredient, form, open])

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    startTransition(async () => {
      if (isEditing) {
        const result = await updateIngredient(ingredient.id, {
          name: values.name,
          unit: values.unit,
          minStock: values.minStock,
          cost: values.cost,
        })
        if (result.success) {
          toast.success("Ingrediente actualizado")
          onOpenChange(false)
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createIngredient({
          name: values.name,
          unit: values.unit,
          minStock: values.minStock,
          cost: values.cost,
          currentStock: values.currentStock,
        })
        if (result.success) {
          toast.success("Ingrediente creado")
          onOpenChange(false)
        } else {
          toast.error(result.error)
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Ingrediente" : "Nuevo Ingrediente"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los detalles del ingrediente."
              : "Registra un nuevo ingrediente en el inventario."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Tomates, Harina, Aceite" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <FormControl>
                      <Input placeholder="kg, l, und" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo Unit.</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Inicial</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Guardar Cambios" : "Crear Ingrediente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
