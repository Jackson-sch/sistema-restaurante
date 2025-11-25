"use client"

import { useState, useTransition } from "react"
import { MoreHorizontal, Trash2, Eye, EyeOff, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { deleteProduct, toggleProductAvailability } from "@/actions/products"
import { ProductDialog } from "./product-dialog"
import { toast } from "sonner"
import { type Category } from "@prisma/client"
import { type ProductWithCategory } from "@/lib/types/product"

interface ProductActionsProps {
    product: ProductWithCategory
    categories: Category[]
}

export function ProductActions({ product, categories }: ProductActionsProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteProduct(product.id)
            if (result.success) {
                toast.success("Producto eliminado")
                setShowDeleteDialog(false)
            } else {
                toast.error(result.error)
            }
        })
    }

    const handleToggleAvailability = () => {
        startTransition(async () => {
            const result = await toggleProductAvailability(product.id, !product.available)
            if (result.success) {
                toast.success(product.available ? "Producto marcado como agotado" : "Producto marcado como disponible")
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ProductDialog
                        categories={categories}
                        product={product}
                        trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                        }
                    />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleToggleAvailability} disabled={isPending}>
                        {product.available ? (
                            <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Marcar como agotado
                            </>
                        ) : (
                            <>
                                <Eye className="mr-2 h-4 w-4" />
                                Marcar como disponible
                            </>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600"
                        disabled={isPending}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el producto{" "}
                            <span className="font-semibold">{product.name}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isPending ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
