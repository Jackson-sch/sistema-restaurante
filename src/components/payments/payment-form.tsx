'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getOrderByPaymentCode, registerPayment } from '@/actions/payments';
import { getReceiptData } from '@/actions/receipts';
import { ReceiptPreview } from '@/components/receipts/receipt-preview';
import { ReceiptData } from '@/types/receipt';

const paymentSchema = z.object({
    paymentCode: z.string().min(1, 'Ingrese el código de pago'),
    method: z.enum(['CASH', 'CARD', 'YAPE', 'PLIN', 'TRANSFER', 'MIXED']),
    amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
    reference: z.string().optional(),
    receiptType: z.enum(['BOLETA', 'FACTURA', 'NOTA_VENTA', 'TICKET']).optional(),
    receiptNumber: z.string().optional(),
    customerDoc: z.string().optional(),
    customerName: z.string().optional(),
    customerAddress: z.string().optional(),
    notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export function PaymentForm() {
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            method: 'CASH',
        },
    });

    const paymentCode = watch('paymentCode');
    const selectedMethod = watch('method');
    const amount = watch('amount');

    const searchOrder = async () => {
        if (!paymentCode) {
            toast.error('Ingrese un código de pago');
            return;
        }

        setIsSearching(true);
        try {
            const order = await getOrderByPaymentCode(paymentCode.toUpperCase());

            if (!order) {
                toast.error('No se encontró ninguna orden con ese código');
                setOrderData(null);
                return;
            }

            if (order.paymentStatus === 'PAID') {
                toast.warning('Esta orden ya está completamente pagada');
            }

            setOrderData(order);
            // Pre-llenar el monto con el total pendiente
            setValue('amount', order.amountDue);
            toast.success('Orden encontrada');
        } catch (error) {
            toast.error('Error al buscar la orden');
            setOrderData(null);
        } finally {
            setIsSearching(false);
        }
    };

    const [seriesList, setSeriesList] = useState<any[]>([]);

    useEffect(() => {
        const fetchSeries = async () => {
            const { getReceiptSeries } = await import('@/actions/receipt-series');
            const result = await getReceiptSeries();
            if (result.success && result.data) {
                setSeriesList(result.data);
            }
        };
        fetchSeries();
    }, []);

    const receiptType = watch('receiptType');

    useEffect(() => {
        if (receiptType) {
            // Manejar autocompletado para TICKET
            if (receiptType === 'TICKET') {
                setValue('customerDoc', '00000000');
                setValue('customerName', 'Publico General');
            }

            // Manejar serie
            if (seriesList.length > 0) {
                const series = seriesList.find(s => s.type === receiptType && s.active);
                if (series) {
                    const nextNumber = series.currentNumber + 1;
                    const formattedNumber = `${series.series}-${nextNumber.toString().padStart(8, '0')}`;
                    setValue('receiptNumber', formattedNumber);
                } else {
                    setValue('receiptNumber', '');
                }
            }
        }
    }, [receiptType, seriesList, setValue]);

    const onSubmit = async (data: PaymentFormData) => {
        if (!orderData) {
            toast.error('Primero busque una orden');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await registerPayment({
                orderId: orderData.id,
                method: data.method,
                amount: data.amount,
                reference: data.reference,
                receiptType: data.receiptType || undefined,
                receiptNumber: data.receiptNumber,
                customerDoc: data.customerDoc,
                customerName: data.customerName,
                customerAddress: data.customerAddress,
                notes: data.notes,
            });

            if (result.success) {
                // ... existing success logic
                toast.success(
                    result.paymentStatus === 'PAID'
                        ? '¡Pago completado exitosamente!'
                        : `Pago parcial registrado. Pendiente: S/ ${result.amountDue?.toFixed(2)}`
                );

                // If receipt type was selected, show receipt preview
                if (data.receiptType && result.paymentId) {
                    const receipt = await getReceiptData(result.paymentId);
                    if (receipt) {
                        setReceiptData(receipt);
                        setShowReceipt(true);
                    }
                }

                // Limpiar formulario
                reset();
                setOrderData(null);

                // Refresh series list to get updated numbers
                const { getReceiptSeries } = await import('@/actions/receipt-series');
                const seriesResult = await getReceiptSeries();
                if (seriesResult.success && seriesResult.data) {
                    setSeriesList(seriesResult.data);
                }
            } else {
                toast.error(result.error || 'Error al registrar el pago');
            }
        } catch (error) {
            toast.error('Error al procesar el pago');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Búsqueda de orden */}
            <Card>
                <CardHeader>
                    <CardTitle>Buscar Orden por Código de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder="Ej: PAY-0001"
                                {...register('paymentCode')}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        searchOrder();
                                    }
                                }}
                                className="uppercase"
                            />
                            {errors.paymentCode && (
                                <p className="text-sm text-destructive mt-1">
                                    {errors.paymentCode.message}
                                </p>
                            )}
                        </div>
                        <Button onClick={searchOrder} disabled={isSearching}>
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                            <span className="ml-2">Buscar</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Detalles de la orden */}
            {orderData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles de la Orden</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-muted-foreground">Número de Orden</Label>
                                <p className="font-semibold">{orderData.orderNumber}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Mesa</Label>
                                <p className="font-semibold">
                                    {orderData.table
                                        ? `${orderData.table.number}${orderData.table.zone ? ` - ${orderData.table.zone.name}` : ''}`
                                        : 'Para llevar'}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Items</Label>
                            {orderData.items.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between text-sm"
                                >
                                    <span>
                                        {item.quantity}x {item.product.name}
                                    </span>
                                    <span>S/ {item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>S/ {orderData.subtotal.toFixed(2)}</span>
                            </div>
                            {orderData.tax > 0 && (
                                <div className="flex justify-between">
                                    <span>IGV:</span>
                                    <span>S/ {orderData.tax.toFixed(2)}</span>
                                </div>
                            )}
                            {orderData.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Descuento:</span>
                                    <span>-S/ {orderData.discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total:</span>
                                <span>S/ {orderData.total.toFixed(2)}</span>
                            </div>
                            {orderData.amountPaid > 0 && (
                                <>
                                    <div className="flex justify-between text-blue-600">
                                        <span>Pagado:</span>
                                        <span>S/ {orderData.amountPaid.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-orange-600">
                                        <span>Pendiente:</span>
                                        <span>S/ {orderData.amountDue.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {orderData.payments && orderData.payments.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">
                                        Pagos Anteriores
                                    </Label>
                                    {orderData.payments.map((payment: any) => (
                                        <div
                                            key={payment.id}
                                            className="flex justify-between text-sm"
                                        >
                                            <span>
                                                {payment.method} - {payment.cashier?.name || 'N/A'}
                                            </span>
                                            <span>S/ {payment.amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Formulario de pago */}
            {orderData && orderData.paymentStatus !== 'PAID' && (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Registrar Pago</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="method">Método de Pago *</Label>
                                    <Select
                                        value={selectedMethod}
                                        onValueChange={(value) =>
                                            setValue('method', value as any)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CASH">Efectivo</SelectItem>
                                            <SelectItem value="CARD">Tarjeta</SelectItem>
                                            <SelectItem value="YAPE">Yape</SelectItem>
                                            <SelectItem value="PLIN">Plin</SelectItem>
                                            <SelectItem value="TRANSFER">
                                                Transferencia
                                            </SelectItem>
                                            <SelectItem value="MIXED">Mixto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Monto *</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        {...register('amount', { valueAsNumber: true })}
                                    />
                                    {errors.amount && (
                                        <p className="text-sm text-destructive">
                                            {errors.amount.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {selectedMethod !== 'CASH' && (
                                <div className="space-y-2">
                                    <Label htmlFor="reference">
                                        Número de Referencia / Operación
                                    </Label>
                                    <Input
                                        id="reference"
                                        placeholder="Ej: 123456789"
                                        {...register('reference')}
                                    />
                                </div>
                            )}

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-lg">Comprobante (Opcional)</Label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="receiptType">Tipo</Label>
                                        <Select
                                            value={watch('receiptType') || undefined}
                                            onValueChange={(value) =>
                                                setValue('receiptType', value as any)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Ninguno" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BOLETA">Boleta</SelectItem>
                                                <SelectItem value="FACTURA">Factura</SelectItem>
                                                <SelectItem value="NOTA_VENTA">Nota de Venta</SelectItem>
                                                <SelectItem value="TICKET">Ticket</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="receiptNumber">Número</Label>
                                        <Input
                                            id="receiptNumber"
                                            placeholder="Ej: B001-00123"
                                            {...register('receiptNumber')}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="customerDoc">DNI / RUC</Label>
                                        <Input
                                            id="customerDoc"
                                            placeholder="Ej: 12345678"
                                            {...register('customerDoc')}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="customerName">Nombre / Razón Social</Label>
                                        <Input
                                            id="customerName"
                                            placeholder="Nombre del cliente"
                                            {...register('customerName')}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customerAddress">Dirección</Label>
                                    <Input
                                        id="customerAddress"
                                        placeholder="Dirección del cliente"
                                        {...register('customerAddress')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notas</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Observaciones adicionales..."
                                    {...register('notes')}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Registrar Pago
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            )}

            {/* Receipt Preview */}
            <ReceiptPreview
                open={showReceipt}
                onOpenChange={setShowReceipt}
                data={receiptData}
            />
        </div>
    );
}
