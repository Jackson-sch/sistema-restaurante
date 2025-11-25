import { getOrderDetails } from '@/actions/orders';
import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderStatusActions } from '@/components/orders/order-status-actions';
import { PaymentCodeDisplay } from '@/components/payments/payment-code-display';

export default async function OrderDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user?.restaurantId) return null;

    const { id } = await params;
    const order = await getOrderDetails(id);

    if (!order) {
        notFound();
    }

    const statusLabels: Record<string, string> = {
        PENDING: 'Pendiente',
        CONFIRMED: 'Confirmado',
        PREPARING: 'Preparando',
        READY: 'Listo',
        SERVED: 'Servido',
        COMPLETED: 'Completado',
        CANCELLED: 'Cancelado',
    };

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        PENDING: 'secondary',
        CONFIRMED: 'default',
        PREPARING: 'default',
        READY: 'default',
        SERVED: 'default',
        COMPLETED: 'outline',
        CANCELLED: 'destructive',
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/dashboard/orders">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Orden {order.orderNumber}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <span>{format(order.createdAt, "d 'de' MMMM, yyyy HH:mm", { locale: es })}</span>
                        <span>•</span>
                        <span>{order.type === 'DINE_IN' ? 'Mesa' : order.type}</span>
                        {order.table && <span>• Mesa {order.table.number}</span>}
                    </div>
                </div>
                <div className="ml-auto">
                    <Badge variant={statusColors[order.status] || 'outline'} className="text-lg px-4 py-1">
                        {statusLabels[order.status] || order.status}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles del Pedido</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start py-2 border-b last:border-0">
                                        <div className="flex gap-3">
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-bold">
                                                {item.quantity}
                                            </div>
                                            <div>
                                                <p className="font-medium">{item.product.name}</p>
                                                {item.modifiers.length > 0 && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {item.modifiers.map((mod) => (
                                                            <span key={mod.id} className="block">
                                                                + {mod.modifier.name} ({formatCurrency(Number(mod.price))})
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {item.notes && (
                                                    <p className="text-sm text-amber-600 italic mt-1">
                                                        Nota: {item.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="font-medium">
                                            {formatCurrency(Number(item.subtotal))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(Number(order.subtotal))}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Impuestos</span>
                                    <span>{formatCurrency(Number(order.tax))}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(Number(order.total))}</span>
                                </div>
                            </div>

                            <Separator />

                            <OrderStatusActions orderId={order.id} currentStatus={order.status} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Cliente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nombre</span>
                                    <span>{order.customerName || 'Cliente General'}</span>
                                </div>
                                {order.user && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Atendido por</span>
                                        <span>{order.user.name}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {order.paymentCode && order.status === 'SERVED' && (
                        <PaymentCodeDisplay
                            paymentCode={order.paymentCode}
                            orderNumber={order.orderNumber}
                            total={order.total}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
