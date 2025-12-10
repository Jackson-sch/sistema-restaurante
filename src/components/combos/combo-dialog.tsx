"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea"
import { ComboWithProducts } from "./combos-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash, Plus } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  image: z.string().optional(),
  active: z.boolean().default(true),
  products: z.array(z.object({
    productId: z.string().min(1, "Selecciona un producto"),
    quantity: z.coerce.number().min(1, "La cantidad debe ser al menos 1")
  })).min(1, "Debes agregar al menos un producto al combo")
})

interface ComboDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: { id: string; name: string; price: number; image: string | null; category: string }[]
  combo: ComboWithProducts | null
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>
}

export function ComboDialog({ open, onOpenChange, products, combo, onSubmit }: ComboDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      image: "",
      active: true,
      products: [{ productId: "", quantity: 1 }]
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products"
  })

  // Reset/Populate form when opening
  useEffect(() => {
    if (open) {
      if (combo) {
        form.reset({
          name: combo.name,
          description: combo.description || "",
          price: combo.price,
          image: combo.image || "",
          active: combo.active,
          products: combo.products.map(p => ({
            productId: p.productId,
            quantity: p.quantity
          }))
        })
      } else {
        form.reset({
          name: "",
          description: "",
          price: 0,
          image: "",
          active: true,
          products: [{ productId: "", quantity: 1 }]
        })
      }
    }
  }, [open, combo, form])

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate suggested price (sum of products)
  const calculateSuggestedPrice = () => {
    const currentProducts = form.getValues("products");
    let total = 0;
    currentProducts.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        total += product.price * item.quantity;
      }
    });
    return total;
  }

  // Group products by category used in Select
  const productsByCategory = products.reduce((acc, product) => {
    const category = product.category || "Otros"
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {} as Record<string, typeof products>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{combo ? "Editar Combo" : "Nuevo Combo"}</DialogTitle>
          <DialogDescription>
            Configura los detalles del combo y los productos que incluye.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 px-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Combo Familiar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción opcional..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen del Combo</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={field.onChange}
                        onRemove={() => field.onChange("")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Productos</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ productId: "", quantity: 1 })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Agregar Producto
                  </Button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`products.${index}.productId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar producto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(productsByCategory).map(([category, items]) => (
                                  <div key={category}>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                                      {category}
                                    </div>
                                    {items.map(product => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name} - S/ {product.price.toFixed(2)}
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`products.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="w-20">
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {form.formState.errors.products?.root && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.products.root.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio del Combo</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <div className="text-xs text-muted-foreground">
                        Valor real suma: S/ {calculateSuggestedPrice().toFixed(2)}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
