'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wallet, MapPin, Clock, RefreshCw, Receipt, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getPendingPayments, type PendingPaymentOrder } from '@/actions/pending-payments';
import { UnifiedPaymentDialog } from '@/components/payments/unified-payment-dialog';

interface PendingPaymentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingPaymentsSheet({ open, onOpenChange }: PendingPaymentsSheetProps) {
  const [orders, setOrders] = useState<PendingPaymentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingPaymentOrder | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getPendingPayments();
      if (result.success && result.data) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch orders when sheet opens
  useEffect(() => {
    if (open) {
      fetchOrders();
    }
  }, [open, fetchOrders]);

  const handleOrderClick = (order: PendingPaymentOrder) => {
    setSelectedOrder(order);
    setPaymentDialogOpen(true);
  };

  const handlePaymentComplete = () => {
    setPaymentDialogOpen(false);
    setSelectedOrder(null);
    fetchOrders(); // Refresh the list
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[450px] flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg">Pagos Pendientes</SheetTitle>
                  <SheetDescription>
                    {orders.length} {orders.length === 1 ? 'orden' : 'órdenes'} por cobrar
                  </SheetDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchOrders}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-3">
              {orders.length === 0 && !isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay pagos pendientes</p>
                  <p className="text-sm">Las órdenes servidas aparecerán aquí</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg text-primary">
                            {order.paymentCode || order.orderNumber}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {order.orderNumber}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {order.table && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Mesa {order.table.number}
                              {order.table.zone && ` - ${order.table.zone.name}`}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.createdAt, "HH:mm")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {formatCurrency(order.total)}
                        </div>
                        <Button size="sm" className="mt-1" variant="default">
                          <CreditCard className="h-4 w-4" /> Cobrar
                        </Button>
                      </div>
                    </div>
                    {order.customerName && (
                      <div className="text-sm text-muted-foreground">
                        Cliente: {order.customerName}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <Separator />
          <div className="p-4 bg-muted/30">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total por cobrar</span>
              <span className="font-bold text-lg">
                {formatCurrency(orders.reduce((sum, o) => sum + o.total, 0))}
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {selectedOrder && (
        <UnifiedPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          orderId={selectedOrder.id}
          orderNumber={selectedOrder.orderNumber}
          totalAmount={selectedOrder.total}
          tableInfo={selectedOrder.table
            ? `Mesa ${selectedOrder.table.number}${selectedOrder.table.zone ? ` - ${selectedOrder.table.zone.name}` : ''}`
            : undefined
          }
          onSuccess={handlePaymentComplete}
        />
      )}
    </>
  );
}
