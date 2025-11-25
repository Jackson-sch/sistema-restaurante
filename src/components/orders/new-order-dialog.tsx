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

interface NewOrderDialogProps {
    categories: Category[]
    products: ProductWithRelations[]
}

export function NewOrderDialog({ categories, products }: NewOrderDialogProps) {
    const [open, setOpen] = useState(false)
    const [tables, setTables] = useState<TableData[]>([])

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

    return (
        <Drawer open={open} onOpenChange={setOpen} direction="right">
            <DrawerTrigger asChild>
                <Button size="lg" className="shadow-md">
                    <Plus className="mr-2 h-5 w-5" />
                    Nuevo Pedido
                </Button>
            </DrawerTrigger>
            <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 w-full max-w-[90vw] rounded-none">
                <VisuallyHidden>
                    <DrawerTitle>Nuevo Pedido</DrawerTitle>
                    <DrawerDescription>Interfaz de punto de venta para crear un nuevo pedido.</DrawerDescription>
                </VisuallyHidden>
                <div className="h-full overflow-hidden">
                    <OrderInterface
                        categories={categories}
                        products={products}
                        tables={tables}
                        onOrderCreated={() => {
                            fetchTables() // Refresh tables after order creation
                            setOpen(false)
                        }}
                        onRefreshTables={fetchTables}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    )
}
