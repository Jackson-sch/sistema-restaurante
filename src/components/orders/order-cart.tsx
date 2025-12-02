"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, cn } from "@/lib/utils"
import { Trash2, Minus, Plus, ShoppingBag, Receipt, CreditCard } from "lucide-react"
import { createOrder } from "@/actions/orders"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { CartItem } from "@/types/order"
import { TableSelector, type TableData } from "./table-selector"

interface OrderCartProps {
    items: CartItem[]
    onRemove: (tempId: string) => void
    onUpdateQuantity: (tempId: string, delta: number) => void
    onClear: () => void
    onOrderCreated?: () => void
    onRefreshTables?: () => void
    tables: TableData[]
    selectedTable: TableData | null
    onTableChange: (table: TableData | null) => void
    onClose?: () => void // For mobile drawer
}

export function OrderCart({
    items,
    onRemove,
    onUpdateQuantity,
    onClear,
    onOrderCreated,
    onRefreshTables,
    tables,
    selectedTable,
    onTableChange,
    onClose,
}: OrderCartProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const calculateItemTotal = (item: CartItem) => {
        let price = Number(item.product.price)
        if (item.variant) {
            price = Number(item.variant.price)
        }

        const modifiersPrice = item.modifiers.reduce((acc, mod) => acc + Number(mod.price), 0)
        return (price + modifiersPrice) * item.quantity
    }

    const subtotal = items.reduce((acc, item) => acc + calculateItemTotal(item), 0)
    const tax = subtotal * 0.18
    const total = subtotal

    const handleCreateOrder = async () => {
        if (items.length === 0) return

        if (!selectedTable) {
            toast.error("Por favor selecciona una mesa")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await createOrder({
                items: items.map((item) => ({
                    productId: item.product.id,
                    variantId: item.variant?.id,
                    quantity: item.quantity,
                    notes: item.notes,
                    modifiers: item.modifiers.map((m) => ({
                        modifierId: m.id,
                        price: Number(m.price),
                        quantity: 1,
                    })),
                    price: Number(item.variant?.price || item.product.price),
                })),
                total: total,
                subtotal: subtotal,
                tax: 0,
                tableId: selectedTable.id,
            })

            if (result.success) {
                toast.success("Pedido creado correctamente")
                onClear()
                onTableChange(null)
                onRefreshTables?.() // Refresh tables list
                onOrderCreated?.()
            } else {
                toast.error(result.error || "Error al crear el pedido")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-background border rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-3 md:p-4 border-b bg-muted/30 space-y-2 md:space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        <h2 className="font-semibold text-base md:text-lg">Resumen de Orden</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                            {items.length} ítems
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
                                aria-label="Volver a productos"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                <TableSelector
                    tables={tables}
                    selectedTable={selectedTable}
                    onSelectTable={onTableChange}
                    disabled={isSubmitting}
                />
            </div>

            {/* Items List */}
            <ScrollArea className="flex-1">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="font-semibold text-lg text-foreground">Tu carrito está vacío</h3>
                        <p className="text-sm mt-1 max-w-[200px]">Agrega productos del menú para comenzar una nueva orden.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {items.map((item) => (
                            <div
                                key={item.tempId}
                                className="p-4 hover:bg-muted/20 transition-colors group animate-in slide-in-from-bottom-2 duration-300"
                            >
                                <div className="flex justify-between items-start gap-3">
                                    {/* Quantity Controls */}
                                    <div className="flex flex-col items-center gap-1 bg-muted/30 rounded-lg p-1">
                                        <button
                                            onClick={() => onUpdateQuantity(item.tempId, 1)}
                                            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-background shadow-sm transition-all text-foreground/70 hover:text-primary"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                        <span className="text-sm font-semibold w-6 text-center tabular-nums">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.tempId, -1)}
                                            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-background shadow-sm transition-all text-foreground/70 hover:text-destructive"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                    </div>

                                    {/* Item Details */}
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-sm text-foreground truncate pr-2">{item.product.name}</h4>
                                            <span className="font-semibold text-sm tabular-nums whitespace-nowrap">
                                                {formatCurrency(calculateItemTotal(item))}
                                            </span>
                                        </div>

                                        <div className="space-y-1 mt-1">
                                            {item.variant && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <span className="w-1 h-1 rounded-full bg-primary/50" />
                                                    <span>{item.variant.name}</span>
                                                </div>
                                            )}

                                            {item.modifiers.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {item.modifiers.map((m) => (
                                                        <span
                                                            key={m.id}
                                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border/50"
                                                        >
                                                            + {m.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {item.notes && (
                                                <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-md mt-2 border border-amber-100 dark:border-amber-900/50 inline-block max-w-full truncate">
                                                    "{item.notes}"
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delete Action */}
                                    <button
                                        onClick={() => onRemove(item.tempId)}
                                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1 -mr-1"
                                        aria-label="Remove item"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Footer Summary */}
            <div className="bg-background border-t p-3 md:p-4 space-y-3 md:space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-end">
                        <span className="font-semibold text-base">Total a Pagar</span>
                        <span className="font-bold text-xl md:text-2xl tabular-nums text-primary tracking-tight">{formatCurrency(total)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    <Button
                        variant="outline"
                        className="col-span-1 h-11 md:h-12 border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 bg-transparent"
                        onClick={onClear}
                        disabled={items.length === 0 || isSubmitting}
                        title="Limpiar carrito"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button
                        className={cn(
                            "col-span-3 h-11 md:h-12 font-bold text-sm md:text-base shadow-md transition-all",
                            "bg-primary hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99]"
                        )}
                        onClick={handleCreateOrder}
                        disabled={items.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                <span>Procesando...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>Confirmar Orden</span>
                                <CreditCard className="h-4 w-4 opacity-80" />
                            </div>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
