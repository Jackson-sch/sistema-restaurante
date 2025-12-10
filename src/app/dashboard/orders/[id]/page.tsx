import { getOrderDetails } from '@/actions/orders';
import { auth } from '@/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Calendar, 
  ChefHat, 
  Clock, 
  CreditCard, 
  MapPin, 
  User, 
  UtensilsCrossed 
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderStatusActions } from '@/components/orders/order-status-actions';
import { PaymentCodeDisplay } from '@/components/payments/payment-code-display';

// Mapeo de colores y textos fuera del componente para limpieza
const STATUS_CONFIG: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
    PENDING: { label: 'Pendiente', color: 'secondary' },
    CONFIRMED: { label: 'Confirmado', color: 'default' }, // Usualmente azul/primario
    PREPARING: { label: 'Preparando', color: 'warning' }, // Naranja/Amarillo (requiere configurar variante warning en badge o usar default con estilo)
    READY: { label: 'Listo', color: 'success' }, // Verde (requiere variante success)
    SERVED: { label: 'Servido', color: 'default' },
    COMPLETED: { label: 'Completado', color: 'outline' },
    CANCELLED: { label: 'Cancelado', color: 'destructive' },
};

// Helper para obtener config o fallback
const getStatusConfig = (status: string) => STATUS_CONFIG[status] || { label: status, color: 'outline' };

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

    const { label: statusLabel, color: statusColor } = getStatusConfig(order.status);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" asChild>
                        <Link href="/dashboard/orders">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Orden #{order.orderNumber}
                            </h1>
                            <Badge variant={statusColor as any} className="text-sm px-3 py-1 uppercase tracking-wider">
                                {statusLabel}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm mt-1">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {format(order.createdAt, "d 'de' MMM, yyyy", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {format(order.createdAt, "HH:mm", { locale: es })}
                            </span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1 font-medium text-foreground">
                                <UtensilsCrossed className="h-3.5 w-3.5" />
                                {order.type === 'DINE_IN' ? 'Consumo en Local' : 'Para Llevar/Delivery'}
                            </span>
                            {order.table && (
                                <Badge variant="outline" className="ml-1 bg-background">
                                    Mesa {order.table.number}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Acciones Rápidas (si las hubiera) o espacio vacío */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Detalles de los productos */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="overflow-hidden border-muted">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <ChefHat className="h-5 w-5 text-primary" />
                                    Detalle del Consumo
                                </CardTitle>
                                <span className="text-sm text-muted-foreground">
                                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {order.items.map((item) => (
                                    <div key={item.id} className="p-4 sm:p-6 hover:bg-muted/10 transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            {/* Cantidad y Nombre */}
                                            <div className="flex gap-4">
                                                <div className="flex items-center justify-center h-10 w-10 shrink-0 rounded-lg bg-primary/10 text-primary font-bold text-lg border border-primary/20">
                                                    {item.quantity}x
                                                </div>
                                                <div className="space-y-1.5">
                                                    <p className="font-semibold text-lg leading-none">{item.product.name}</p>
                                                    
                                                    {/* Modificadores como Badges */}
                                                    {item.modifiers.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {item.modifiers.map((mod) => (
                                                                <Badge key={mod.id} variant="secondary" className="text-xs font-normal text-muted-foreground bg-muted hover:bg-muted-foreground/20">
                                                                    + {mod.modifier.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Notas destacadas */}
                                                    {item.notes && (
                                                        <div className="mt-2 inline-flex items-start gap-1.5 px-2.5 py-1.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-sm border border-amber-200 dark:border-amber-900/50">
                                                            <span className="font-bold text-xs uppercase tracking-wide">Nota:</span>
                                                            <span className="italic">{item.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Precio */}
                                            <div className="text-right shrink-0">
                                                <div className="font-semibold text-lg">
                                                    {formatCurrency(Number(item.subtotal))}
                                                </div>
                                                {item.modifiers.length > 0 && (
                                                    <p className="text-xs text-muted-foreground">Incl. extras</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Resumen y Cliente */}
                <div className="space-y-6">
                    {/* Tarjeta de Resumen Financiero */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                Resumen de Pago
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(Number(order.subtotal))}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Impuestos</span>
                                    <span>{formatCurrency(Number(order.tax))}</span>
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex justify-between items-end">
                                <span className="font-semibold text-lg">Total</span>
                                <span className="font-bold text-3xl text-primary">
                                    {formatCurrency(Number(order.total))}
                                </span>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 p-4 block space-y-4">
                            <OrderStatusActions orderId={order.id} currentStatus={order.status} />
                            
                            {order.paymentCode && order.status === 'SERVED' && (
                                <div className="pt-2">
                                    <PaymentCodeDisplay
                                        paymentCode={order.paymentCode}
                                        orderNumber={order.orderNumber}
                                        total={order.total}
                                    />
                                </div>
                            )}
                        </CardFooter>
                    </Card>

                    {/* Tarjeta de Información del Cliente/Staff */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                Información
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border p-3 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                                        <p className="font-medium text-base">{order.customerName || 'Cliente General'}</p>
                                    </div>
                                </div>
                                
                                {order.user && (
                                    <>
                                        <Separator className="my-2" />
                                        <div className="flex items-start gap-3">
                                            <div className="bg-muted p-2 rounded-full">
                                                <ChefHat className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Atendido por</p>
                                                <p className="text-sm">{order.user.name}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}