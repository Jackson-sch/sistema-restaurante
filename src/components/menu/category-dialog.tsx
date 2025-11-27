"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { categorySchema, type CategoryInput } from "@/lib/schemas/menu"
import { createCategory, updateCategory } from "@/actions/categories"
import { toast } from "sonner"
import { type Category } from "@prisma/client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/ui/image-upload"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"

interface CategoryDialogProps {
    category?: Category
    trigger?: React.ReactNode
}

export function CategoryDialog({ category, trigger }: CategoryDialogProps) {
    const { hasPermission } = usePermissions()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Permission check - AFTER all hooks
    const canCreate = hasPermission(PERMISSIONS.CATEGORIES_CREATE)
    const canUpdate = hasPermission(PERMISSIONS.CATEGORIES_UPDATE)
    const isEditing = !!category



    const {
        register,
        handleSubmit,
        reset,
        setValue,
        getValues,
        watch,
        formState: { errors },
    } = useForm<CategoryInput>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: category?.name || "",
            slug: category?.slug || "",
            image: category?.image || "",
        },
    })

    const onSubmit = (data: CategoryInput) => {
        startTransition(async () => {
            if (category) {
                const result = await updateCategory(category.id, data)
                if (result.success) {
                    toast.success("Categoría actualizada correctamente")
                    setOpen(false)
                    reset()
                } else {
                    toast.error(result.error)
                }
            } else {
                const result = await createCategory(data)
                if (result.success) {
                    toast.success("Categoría creada correctamente")
                    setOpen(false)
                    reset()
                } else {
                    toast.error(result.error)
                }
            }
        })
    }

    if (isEditing && !canUpdate) return null
    if (!isEditing && !canCreate) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Nueva Categoría</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{category ? "Editar Categoría" : "Crear Categoría"}</DialogTitle>
                    <DialogDescription>
                        {category
                            ? "Modifica los datos de la categoría."
                            : "Agrega una nueva categoría para organizar el menú."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            placeholder="Ej. Bebidas"
                            {...register("name")}
                            onChange={(e) => {
                                register("name").onChange(e)
                                // Auto-generate slug
                                const slug = e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, "-")
                                    .replace(/^-+|-+$/g, "")
                                setValue("slug", slug)
                            }}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <Input
                            id="slug"
                            placeholder="ej-bebidas"
                            {...register("slug")}
                        />
                        {errors.slug && (
                            <p className="text-sm text-red-500">{errors.slug.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Imagen</Label>
                        <ImageUpload
                            value={watch("image") || ""}
                            onChange={(url) => setValue("image", url)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
