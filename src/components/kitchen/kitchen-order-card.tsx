"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, CheckCircle2, PlayCircle, AlertCircle } from "lucide-react"
import { updateOrderStatus } from "@/actions/orders"
import { toast } from "sonner"
import { useTransition } from "react"

interface KitchenOrderCardProps {
    order: any // Typed properly in real scenario
    onRefresh?: () => void
}

export function KitchenOrderCard({ order, onRefresh }: KitchenOrderCardProps) {
    const [isPending, startTransition] = useTransition()

    const handleStatusUpdate = (newStatus: string) => {
        startTransition(async () => {
            const result = await updateOrderStatus(order.id, newStatus)
            if (result.success) {
                toast.success(`Pedido ${newStatus === 'READY' ? 'listo' : 'actualizado'}`)
                // Trigger immediate refresh
                onRefresh?.()
            } else {
                toast.error("Error al actualizar estado")
            }
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800'
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
            case 'PREPARING': return 'bg-orange-100 text-orange-800'
            case 'READY': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold">
                            {order.orderNumber}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Mesa: {order.table?.number || 'Para llevar'}
                        </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status}
                    </Badge>
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es })}
                </div>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="space-y-2">
                    {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-start text-sm border-b pb-2 last:border-0 last:pb-0">
                            <div>
                                <div className="font-medium">
                                    <span className="font-bold mr-1">{item.quantity}x</span>
                                    {item.product.name}
                                </div>
                                {item.modifiers && item.modifiers.length > 0 && (
                                    <div className="text-xs text-muted-foreground pl-4">
                                        {item.modifiers.map((m: any) => (
                                            <div key={m.id}>+ {m.modifier.name}</div>
                                        ))}
                                    </div>
                                )}
                                {item.notes && (
                                    <div className="text-xs text-amber-600 pl-4 italic">
                                        Nota: {item.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-end gap-2">
                {order.status === 'PENDING' && (
                    <Button
                        size="sm"
                        onClick={() => handleStatusUpdate('PREPARING')}
                        disabled={isPending}
                    >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Empezar
                    </Button>
                )}
                {order.status === 'PREPARING' && (
                    <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate('READY')}
                        disabled={isPending}
                    >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Listo
                    </Button>
                )}
                {order.status === 'READY' && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate('SERVED')}
                        disabled={isPending}
                    >
                        Servido
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
