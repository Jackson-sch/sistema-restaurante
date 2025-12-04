"use client"

import { useState, useEffect } from "react"
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { OrderInterface, type ProductWithRelations } from "./order-interface"
import { Category } from "@prisma/client"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { getTables } from "@/actions/tables"
import type { TableData } from "./table-selector"
import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { useSwipeGesture } from "@/hooks/use-swipe-gesture"

interface NewOrderDialogProps {
    categories: Category[]
    products: ProductWithRelations[]
    buttonSize?: "default" | "sm" | "lg" | "icon"
    buttonVariant?: "default" | "ghost" | "outline"
    showLabel?: boolean
    preselectedTable?: { id: string; number: string } | null
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: () => void
}

export function NewOrderDialog({
    categories,
    products,
    buttonSize = "lg",
    buttonVariant = "default",
    showLabel = true,
    preselectedTable = null,
    isOpen: externalOpen,
    onOpenChange: externalOnOpenChange,
    onSuccess
}: NewOrderDialogProps) {
    const { hasPermission } = usePermissions()
    const [internalOpen, setInternalOpen] = useState(false)
    const [tables, setTables] = useState<TableData[]>([])

    // Use external control if provided, otherwise use internal state
    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = externalOnOpenChange || setInternalOpen

    // Enable swipe gesture to open drawer (swipe from right edge to left)
    // Only enable if not externally controlled
    useSwipeGesture({
        onSwipeLeft: () => {
            if (!open && hasPermission(PERMISSIONS.ORDERS_CREATE) && externalOpen === undefined) {
                setOpen(true)
            }
        },
        threshold: 50, // Minimum swipe distance
        edgeThreshold: 50, // Distance from right edge to detect swipe
    })

    // Fetch tables function
    const fetchTables = async () => {
        const result = await getTables()
        if (result.success && result.data) {
            setTables(result.data as TableData[])
        }
    }

    // Refresh tables when drawer opens
    useEffect(() => {
        if (open) {
            fetchTables()
        }
    }, [open])

    if (!hasPermission(PERMISSIONS.ORDERS_CREATE)) {
        return null
    }

    return (
        <Drawer open={open} onOpenChange={setOpen} direction="right">
            {!preselectedTable && (
                <DrawerTrigger asChild>
                    <Button size={buttonSize} variant={buttonVariant} className="shadow-md">
                        <Plus className="h-5 w-5" />
                        {showLabel && <span className="ml-2">Nuevo Pedido</span>}
                    </Button>
                </DrawerTrigger>
            )}
            <DrawerContent className="h-dvh top-0 right-0 left-auto mt-0 w-full max-w-[100vw] rounded-none">
                <VisuallyHidden>
                    <DrawerTitle>Nuevo Pedido</DrawerTitle>
                    <DrawerDescription>Interfaz de punto de venta para crear un nuevo pedido.</DrawerDescription>
                </VisuallyHidden>
                <div className="h-full overflow-hidden">
                    <OrderInterface
                        categories={categories}
                        products={products}
                        tables={tables}
                        preselectedTable={preselectedTable}
                        onOrderCreated={() => {
                            fetchTables() // Refresh tables after order creation
                            setOpen(false)
                            onSuccess?.() // Call parent callback
                        }}
                        onRefreshTables={fetchTables}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    )
}
