'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink, User, MapPin, Clock, Receipt, Copy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { OrderStatusActions } from './order-status-actions';
import { OrderTypeBadge } from './order-type-badge';
import type { OrderColumn } from './columns';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
  product: {
    id: string;
    name: string;
    price: number;
    cost: number;
  };
  modifiers?: Array<{
    id: string;
    price: number;
    modifier: {
      name: string;
    };
  }>;
}

interface OrderWithItems extends OrderColumn {
  items: OrderItem[];
}

interface OrderDetailSheetProps {
  order: OrderWithItems | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function OrderDetailSheet({ order, open, onOpenChange }: OrderDetailSheetProps) {
  if (!order) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[500px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <SheetTitle className="text-xl">
                Orden {order.orderNumber}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <Clock className="h-3.5 w-3.5" />
                {format(new Date(order.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}
              </SheetDescription>
            </div>
            <Badge
              variant={statusColors[order.status] || 'outline'}
              className="text-sm px-3 py-1"
            >
              {statusLabels[order.status] || order.status}
            </Badge>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <OrderTypeBadge type={order.type as any} />
            {order.table && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Mesa {order.table.number}
              </div>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Productos
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                        {item.quantity}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.modifiers.map((mod) => (
                              <span key={mod.id} className="block">
                                + {mod.modifier.name} ({formatCurrency(mod.price)})
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-xs text-amber-600 italic mt-1">
                            Nota: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="font-medium text-sm shrink-0">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Impuestos</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.tip > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Propina</span>
                  <span>{formatCurrency(order.tip)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            <Separator />

            {/* Customer Info */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </h3>
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
            </div>

            {/* Payment Code - Show for SERVED orders */}
            {order.paymentCode && order.status === 'SERVED' && (
              <>
                <Separator />
                <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Código de Pago
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold tracking-wider text-primary mb-1">
                      {order.paymentCode}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: {formatCurrency(order.total)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => {
                      navigator.clipboard.writeText(order.paymentCode!);
                      toast.success('Código copiado al portapapeles');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-2" />
                    Copiar código
                  </Button>
                </div>
              </>
            )}

            <Separator />

            {/* Status Actions */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                Acciones
              </h3>
              <OrderStatusActions orderId={order.id} currentStatus={order.status} />
            </div>
          </div>
        </ScrollArea>

        {/* Footer with full details link */}
        <div className="p-4 border-t bg-muted/30">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/dashboard/orders/${order.id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir completo
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
