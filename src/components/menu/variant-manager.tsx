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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

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
            const result = editingVariant
                ? await updateVariant(editingVariant.id, data)
                : await createVariant(data)

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
                // NO cerramos el diálogo - el usuario lo cierra manualmente
            } else {
                toast.error(result.error)
            }
        })
    }

    const handleDelete = (id: string) => {
        if (confirm("¿Estás seguro de eliminar esta variante?")) {
            startTransition(async () => {
                const result = await deleteVariant(id)
                if (result.success) {
                    toast.success("Variante eliminada")
                    onRefresh()
                } else {
                    toast.error(result.error)
                }
            })
        }
    }

    const handleDialogClose = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            setEditingVariant(null)
            onRefresh()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Variantes (Tamaños/Presentaciones)</h3>
                <Button onClick={() => { setEditingVariant(null); setIsDialogOpen(true); }} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Variante
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {variants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay variantes registradas
                                </TableCell>
                            </TableRow>
                        ) : (
                            variants.map((variant) => (
                                <TableRow key={variant.id}>
                                    <TableCell className="font-medium">{variant.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{variant.description || "-"}</TableCell>
                                    <TableCell>{formatCurrency(variant.price)}</TableCell>
                                    <TableCell>{variant.sku || "-"}</TableCell>
                                    <TableCell>
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variant.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                            {variant.available ? "Disponible" : "No disponible"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setEditingVariant(variant); setIsDialogOpen(true); }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => handleDelete(variant.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingVariant ? "Editar Variante" : "Nueva Variante"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" placeholder="Ej. Personal, Familiar" {...register("name")} />
                            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción (Opcional)</Label>
                            <Input id="description" placeholder="Ej. Porción individual, Para 3-4 personas" {...register("description")} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Precio</Label>
                                <Input id="price" type="number" step="0.01" {...register("price")} />
                                {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU (Opcional)</Label>
                                <Input id="sku" {...register("sku")} />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="available"
                                checked={watch("available")}
                                onCheckedChange={(checked) => setValue("available", checked)}
                            />
                            <Label htmlFor="available">Disponible</Label>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Guardando..." : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
