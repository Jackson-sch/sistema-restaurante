"use client"

import { useState, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { variantSchema, type VariantInput } from "@/lib/schemas/menu"
import { createVariant, updateVariant, deleteVariant } from "@/actions/product-options"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Package, DollarSign, Tag, Loader2, PackageOpen } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface Variant {
  id: string
  name: string
  description: string | null
  price: number
  sku: string | null
  available: boolean
}

interface VariantManagerProps {
  productId: string
  variants: Variant[]
  onRefresh: () => void
}

export function VariantManager({ productId, variants, onRefresh }: VariantManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)
  const [deletingVariant, setDeletingVariant] = useState<Variant | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      productId,
      name: "",
      description: "",
      price: 0,
      sku: "",
      available: true,
    },
  })

  useEffect(() => {
    if (isDialogOpen) {
      if (editingVariant) {
        reset({
          productId,
          name: editingVariant.name,
          description: editingVariant.description || "",
          price: editingVariant.price,
          sku: editingVariant.sku || "",
          available: editingVariant.available,
        })
      } else {
        reset({
          productId,
          name: "",
          description: "",
          price: 0,
          sku: "",
          available: true,
        })
      }
    }
  }, [isDialogOpen, editingVariant, productId, reset])

  const onSubmit = (data: VariantInput) => {
    startTransition(async () => {
      const result = editingVariant ? await updateVariant(editingVariant.id, data) : await createVariant(data)

      if (result.success) {
        toast.success(editingVariant ? "Variante actualizada" : "Variante creada")
        reset({
          productId,
          name: "",
          description: "",
          price: 0,
          sku: "",
          available: true,
        })
        onRefresh()
        setIsDialogOpen(false)
        setEditingVariant(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  const handleDelete = () => {
    if (!deletingVariant) return
    startTransition(async () => {
      const result = await deleteVariant(deletingVariant.id)
      if (result.success) {
        toast.success("Variante eliminada")
        onRefresh()
      } else {
        toast.error(result.error)
      }
      setDeletingVariant(null)
    })
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingVariant(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Variantes</h3>
          <p className="text-sm text-muted-foreground">Tamaños, presentaciones o versiones del producto</p>
        </div>
        <Button
          onClick={() => {
            setEditingVariant(null)
            setIsDialogOpen(true)
          }}
          size="sm"
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Agregar
        </Button>
      </div>

      {/* Variants List */}
      {variants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg bg-muted/30">
          <div className="rounded-full bg-muted p-3 mb-4">
            <PackageOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Sin variantes</p>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-[250px]">
            Agrega variantes como tamaños o presentaciones para este producto
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingVariant(null)
              setIsDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Crear primera variante
          </Button>
        </div>
      ) : (
        <div className="grid gap-2">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className={cn(
                "group relative flex items-center justify-between gap-4 p-3 rounded-lg border bg-card transition-colors hover:bg-accent/50",
                !variant.available && "opacity-60",
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="shrink-0 flex items-center justify-center h-9 w-9 rounded-md bg-primary/10 text-primary">
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{variant.name}</span>
                    <Badge
                      variant={variant.available ? "default" : "secondary"}
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-5",
                        variant.available
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15"
                          : "bg-muted text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {variant.available ? "Disponible" : "No disponible"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-sm font-semibold text-primary">{formatCurrency(variant.price)}</span>
                    {variant.sku && <span className="text-xs text-muted-foreground">SKU: {variant.sku}</span>}
                  </div>
                  {variant.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{variant.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setEditingVariant(variant)
                    setIsDialogOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Editar</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setDeletingVariant(variant)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </div>
              {editingVariant ? "Editar variante" : "Nueva variante"}
            </DialogTitle>
            <DialogDescription>
              {editingVariant ? "Modifica los datos de esta variante" : "Agrega una nueva variante del producto"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder="Ej. Personal, Familiar, Grande" className="pl-9" {...register("name")} />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción
                <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
              </Label>
              <Input id="description" placeholder="Ej. Para 3-4 personas" {...register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Precio <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-9"
                    {...register("price")}
                  />
                </div>
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-sm font-medium">
                  SKU
                  <span className="text-muted-foreground font-normal ml-1">(opcional)</span>
                </Label>
                <Input id="sku" placeholder="ABC-123" {...register("sku")} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="available" className="text-sm font-medium cursor-pointer">
                  Disponible para venta
                </Label>
                <p className="text-xs text-muted-foreground">Esta variante aparecerá en el menú</p>
              </div>
              <Switch
                id="available"
                checked={watch("available")}
                onCheckedChange={(checked) => setValue("available", checked)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => handleDialogClose(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Guardando...
                  </>
                ) : editingVariant ? (
                  "Guardar cambios"
                ) : (
                  "Crear variante"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingVariant} onOpenChange={(open) => !open && setDeletingVariant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar variante?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar la variante{" "}
              <span className="font-medium text-foreground">"{deletingVariant?.name}"</span>. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
