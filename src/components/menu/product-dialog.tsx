"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, type ProductInput } from "@/lib/schemas/menu"
import { createProduct, updateProduct } from "@/actions/products"
import { createCategory } from "@/actions/categories"
import { toast } from "sonner"
import { type Category } from "@prisma/client"
import { type ProductWithCategory } from "@/lib/types/product"
import { getProductOptions } from "@/actions/product-options"
import { VariantManager } from "./variant-manager"
import { ModifierManager } from "./modifier-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RecipeManager } from "@/components/inventory/recipe-manager"



import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"

interface ProductDialogProps {
    categories: Category[]
    product?: ProductWithCategory
    trigger?: React.ReactNode
}

export function ProductDialog({ categories, product, trigger }: ProductDialogProps) {
    const { hasPermission } = usePermissions()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const isEditing = !!product

    // Local state for categories to support inline creation
    const [categoriesList, setCategoriesList] = useState(categories)
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [isCreatingCatPending, startCatTransition] = useTransition()

    // Options state
    const [variants, setVariants] = useState<any[]>([])
    const [modifierGroups, setModifierGroups] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState("general")

    // Permission check - AFTER all hooks
    const canCreate = hasPermission(PERMISSIONS.PRODUCTS_CREATE)
    const canUpdate = hasPermission(PERMISSIONS.PRODUCTS_UPDATE)



    const fetchOptions = async () => {
        if (product?.id) {
            const result = await getProductOptions(product.id)
            if (result.success && result.data) {
                setVariants(result.data.variants)
                setModifierGroups(result.data.modifierGroups)
            }
        }
    }

    useEffect(() => {
        if (open && product?.id) {
            fetchOptions()
        }
    }, [open, product])

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        getValues,
        watch,
        formState: { errors },
    } = useForm<ProductInput>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            price: 0,
            available: true,
            categoryId: "",
            image: "",
            sku: "",
            cost: 0,
            preparationTime: 0,
            images: [],
            featured: false,
            allergens: [],
            tags: [],
        },
    })

    // Populate form when editing
    useEffect(() => {
        if (product && open) {
            reset({
                name: product.name,
                description: product.description || "",
                price: Number(product.price),
                categoryId: product.categoryId,
                image: product.image || "",
                available: product.available,
                sku: product.sku || "",
                cost: product.cost ? Number(product.cost) : 0,
                preparationTime: product.preparationTime ? Number(product.preparationTime) : 0,
                images: product.images || [],
                featured: product.featured,
                allergens: product.allergens || [],
                tags: product.tags || [],
            })
        } else if (!open) {
            reset({
                name: "",
                description: "",
                price: 0,
                available: true,
                categoryId: "",
                image: "",
                sku: "",
                cost: 0,
                preparationTime: 0,
                images: [],
                featured: false,
                allergens: [],
                tags: [],
            })
        }
    }, [product, open, reset])

    const onSubmit = (data: ProductInput) => {
        startTransition(async () => {
            const result = isEditing
                ? await updateProduct(product.id, data)
                : await createProduct(data)

            if (result.success) {
                toast.success(isEditing ? "Producto actualizado correctamente" : "Producto creado correctamente")
                setOpen(false)
                reset()
            } else {
                toast.error(result.error)
            }
        })
    }

    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) return

        startCatTransition(async () => {
            // Auto-generate slug for the new category
            const slug = newCategoryName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")

            const result = await createCategory({ name: newCategoryName, slug })

            if (result.success && result.data) {
                toast.success("Categoría creada")
                setCategoriesList([...categoriesList, result.data])
                setValue("categoryId", result.data.id)
                setIsCreatingCategory(false)
                setNewCategoryName("")
            } else {
                toast.error(result.error || "Error al crear categoría")
            }
        })
    }

    if (isEditing && !canUpdate) return null
    if (!isEditing && !canCreate) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>{isEditing ? "Editar" : "Nuevo Plato"}</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Plato" : "Crear Plato"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Gestiona los detalles, variantes y modificadores del plato." : "Agrega un nuevo plato al menú."}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="variants" disabled={!isEditing}>Variantes</TabsTrigger>
                        <TabsTrigger value="modifiers" disabled={!isEditing}>Modificadores</TabsTrigger>
                        <TabsTrigger value="recipe" disabled={!isEditing}>Receta</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    placeholder="Ej. Lomo Saltado"
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="categoryId">Categoría</Label>
                                    {!isEditing && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                                            onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                                        >
                                            {isCreatingCategory ? "Cancelar" : "+ Nueva Categoría"}
                                        </Button>
                                    )}
                                </div>

                                {isCreatingCategory ? (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Nombre de nueva categoría"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleCreateCategory}
                                            disabled={isCreatingCatPending || !newCategoryName.trim()}
                                        >
                                            Crear
                                        </Button>
                                    </div>
                                ) : (
                                    <Select
                                        onValueChange={(value) => setValue("categoryId", value)}
                                        defaultValue={getValues("categoryId")}
                                        value={watch("categoryId")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoriesList.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                {errors.categoryId && !isCreatingCategory && (
                                    <p className="text-sm text-red-500">{errors.categoryId.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Imagen</Label>
                                <ImageUpload
                                    value={watch("image") || ""}
                                    onChange={(url) => setValue("image", url)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Precio (S/)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        {...register("price")}
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-red-500">{errors.price.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2 flex flex-col justify-end pb-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="available"
                                            checked={watch("available")}
                                            onCheckedChange={(checked) => setValue("available", checked)}
                                        />
                                        <Label htmlFor="available">Disponible</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Descripción del plato..."
                                    {...register("description")}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Guardando..." : "Guardar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="variants" className="py-4">
                        {product && (
                            <VariantManager
                                productId={product.id}
                                variants={variants}
                                onRefresh={fetchOptions}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="modifiers" className="py-4">
                        {product && (
                            <ModifierManager
                                productId={product.id}
                                modifierGroups={modifierGroups}
                                onRefresh={fetchOptions}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="recipe" className="py-4">
                        {product && (
                            <RecipeManager productId={product.id} variants={variants} />
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
