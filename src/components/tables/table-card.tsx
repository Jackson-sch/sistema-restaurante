"use client"

import type { Table, Zone } from "@prisma/client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Users,
    Trash2,
    Pencil,
    QrCode,
    Receipt,
    Clock,
    ChevronRight,
    UtensilsCrossed,
    ShoppingBag,
    MoreHorizontal,
    Plus,
    Eye,
    CreditCard,
} from "lucide-react"
import { deleteTable, updateTableStatus } from "@/actions/tables"
import { toast } from "sonner"
import { useTransition, useState } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { TableDialog } from "@/components/tables/table-dialog"
import { OrderDetailsDialog } from "@/components/tables/order-details-dialog"
import { UnifiedPaymentDialog } from "@/components/payments/unified-payment-dialog"

type OrderStatus = "PENDING" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED"
type OrderType = "DINE_IN" | "TAKEOUT" | "DELIVERY"

interface Order {
    id: string
    orderNumber: string
    status: OrderStatus
    type: OrderType
    total: number
    subtotal: number
    createdAt: Date
}

interface TableCardProps {
    table: Table & {
        zone?: Zone | null
        orders?: Order[]
    }
    onViewOrders?: (tableId: string) => void
    onUpdate?: () => void
    onQuickOrder?: (table: Table) => void
}

export function TableCard({ table, onViewOrders, onUpdate, onQuickOrder }: TableCardProps) {
    const [isPending, startTransition] = useTransition()
    const [isHovered, setIsHovered] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>("")
    const [selectedOrderTotal, setSelectedOrderTotal] = useState<number>(0)

    // Filter active orders (not completed or cancelled)
    const activeOrders = table.orders?.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.status)) || []

    const totalActiveAmount = activeOrders.reduce((sum, order) => sum + order.total, 0)

    const handleDelete = () => {
        if (activeOrders.length > 0) {
            toast.error("No puedes eliminar una mesa con órdenes activas")
            return
        }
        if (confirm(`¿Estás seguro de eliminar la Mesa ${table.number}?`)) {
            startTransition(async () => {
                const result = await deleteTable(table.id)
                if (result.success) {
                    toast.success("Mesa eliminada correctamente")
                    onUpdate?.()
                } else {
                    toast.error(result.error)
                }
            })
        }
    }

    const handleStatusChange = (status: "AVAILABLE" | "OCCUPIED" | "RESERVED") => {
        startTransition(async () => {
            const result = await updateTableStatus(table.id, status)
            if (result.success) {
                toast.success(`Mesa marcada como ${getStatusLabel(status).toLowerCase()}`)
                onUpdate?.()
            } else {
                toast.error(result.error)
            }
        })
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "AVAILABLE":
                return {
                    color: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
                    label: "Disponible",
                    dot: "bg-emerald-500",
                }
            case "OCCUPIED":
                return {
                    color: "bg-rose-500/15 text-rose-700 border-rose-200",
                    label: "Ocupada",
                    dot: "bg-rose-500",
                }
            case "RESERVED":
                return {
                    color: "bg-amber-500/15 text-amber-700 border-amber-200",
                    label: "Reservada",
                    dot: "bg-amber-500",
                }
            default:
                return {
                    color: "bg-muted text-muted-foreground",
                    label: status,
                    dot: "bg-muted-foreground",
                }
        }
    }

    const getStatusLabel = (status: string) => {
        return getStatusConfig(status).label
    }

    const getOrderStatusConfig = (status: OrderStatus) => {
        switch (status) {
            case "PENDING":
                return { color: "bg-amber-100 text-amber-700", label: "Pendiente" }
            case "PREPARING":
                return { color: "bg-blue-100 text-blue-700", label: "Preparando" }
            case "READY":
                return { color: "bg-emerald-100 text-emerald-700", label: "Listo" }
            case "SERVED":
                return { color: "bg-purple-100 text-purple-700", label: "Servido" }
            default:
                return { color: "bg-muted text-muted-foreground", label: status }
        }
    }

    const getOrderTypeIcon = (type: OrderType) => {
        switch (type) {
            case "DINE_IN":
                return <UtensilsCrossed className="h-3 w-3" />
            case "TAKEOUT":
                return <ShoppingBag className="h-3 w-3" />
            default:
                return <Receipt className="h-3 w-3" />
        }
    }

    const statusConfig = getStatusConfig(table.status)

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-200",
                isHovered && "shadow-md",
                isPending && "opacity-70 pointer-events-none",
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-tight">Mesa {table.number}</h3>
                        {table.qrCode && <QrCode className="h-4 w-4 text-muted-foreground" aria-label="Tiene código QR" />}
                    </div>
                    {table.zone && <p className="text-sm text-muted-foreground truncate">{table.zone.name}</p>}
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Badge
                                variant="outline"
                                className={cn("cursor-pointer transition-colors gap-1.5 font-medium", statusConfig.color)}
                            >
                                <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig.dot)} />
                                {statusConfig.label}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleStatusChange("AVAILABLE")} disabled={table.status === "AVAILABLE"}>
                                <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                                Marcar Disponible
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange("OCCUPIED")} disabled={table.status === "OCCUPIED"}>
                                <span className="h-2 w-2 rounded-full bg-rose-500 mr-2" />
                                Marcar Ocupada
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange("RESERVED")} disabled={table.status === "RESERVED"}>
                                <span className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                                Marcar Reservada
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Más opciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <TableDialog
                                table={table}
                                open={editDialogOpen}
                                onOpenChange={setEditDialogOpen}
                                onSuccess={onUpdate}
                                trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Editar mesa
                                    </DropdownMenuItem>
                                }
                            />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar mesa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Capacity indicator */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{table.capacity} personas</span>
                    </div>
                </div>

                {/* Active orders section */}
                {activeOrders.length > 0 ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Órdenes activas</span>
                            <span className="text-xs font-semibold text-foreground">Total: S/ {totalActiveAmount.toFixed(2)}</span>
                        </div>

                        <div className="space-y-2">
                            {activeOrders.slice(0, 2).map((order) => {
                                const orderStatus = getOrderStatusConfig(order.status)
                                return (
                                    <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            {getOrderTypeIcon(order.type)}
                                            <span className="text-sm font-medium">{order.orderNumber}</span>
                                            <Badge variant="secondary" className={cn("text-xs", orderStatus.color)}>
                                                {orderStatus.label}
                                            </Badge>
                                        </div>
                                        <span className="text-sm font-semibold">S/ {order.total.toFixed(2)}</span>
                                    </div>
                                )
                            })}

                            {activeOrders.length > 2 && (
                                <button
                                    onClick={() => onViewOrders?.(table.id)}
                                    className="flex items-center justify-center gap-1 w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Ver {activeOrders.length - 2} más
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    const firstOrder = activeOrders[0]
                                    setSelectedOrderId(firstOrder.id)
                                    setSelectedOrderNumber(firstOrder.orderNumber)
                                    setSelectedOrderTotal(firstOrder.total)
                                    setOrderDetailsOpen(true)
                                }}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                Detalles
                            </Button>
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    const firstOrder = activeOrders[0]
                                    setSelectedOrderId(firstOrder.id)
                                    setSelectedOrderNumber(firstOrder.orderNumber)
                                    setSelectedOrderTotal(firstOrder.total)
                                    setPaymentDialogOpen(true)
                                }}
                                size="sm"
                                className="flex-1"
                            >
                                <CreditCard className="h-4 w-4 mr-1" />
                                Pagar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-2" />
                            Sin órdenes activas
                        </div>
                        {table.status === "AVAILABLE" && onQuickOrder && (
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onQuickOrder(table)
                                }}
                                className="w-full"
                                size="sm"
                                variant="default"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo Pedido
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>

            {/* Dialogs */}
            {selectedOrderId && (
                <>
                    <OrderDetailsDialog
                        orderId={selectedOrderId}
                        open={orderDetailsOpen}
                        onOpenChange={setOrderDetailsOpen}
                        onPaymentClick={() => {
                            setOrderDetailsOpen(false)
                            setPaymentDialogOpen(true)
                        }}
                    />
                    <UnifiedPaymentDialog
                        orderId={selectedOrderId}
                        orderNumber={selectedOrderNumber}
                        totalAmount={selectedOrderTotal}
                        open={paymentDialogOpen}
                        onOpenChange={setPaymentDialogOpen}
                        tableInfo={table.zone ? `Mesa ${table.number} - ${table.zone.name}` : `Mesa ${table.number}`}
                        onSuccess={() => {
                            onUpdate?.()
                            setSelectedOrderId(null)
                        }}
                    />
                </>
            )}
        </Card>
    )
}
