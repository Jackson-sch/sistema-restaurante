'use client';

import * as React from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createPaymentColumns } from './payment-columns';
import { getPaymentHistory } from '@/actions/payments';
import { getReceiptData } from '@/actions/receipts';
import { ReceiptPreview } from '@/components/receipts/receipt-preview';
import { ReceiptData } from '@/types/receipt';
import { useQueryStates, parseAsString } from 'nuqs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function PaymentHistory() {
    const [payments, setPayments] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [receiptData, setReceiptData] = React.useState<ReceiptData | null>(null);
    const [showReceipt, setShowReceipt] = React.useState(false);

    const [params, setParams] = useQueryStates({
        method: parseAsString.withDefault('ALL'),
    });

    React.useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        setLoading(true);
        const result = await getPaymentHistory({ page: 1, limit: 100 });
        setPayments(result.data);
        setLoading(false);
    };

    const handleReprint = async (paymentId: string) => {
        const receipt = await getReceiptData(paymentId);
        if (receipt) {
            setReceiptData(receipt);
            setShowReceipt(true);
        }
    };

    const columns = createPaymentColumns(handleReprint);

    // Filter payments by method
    const filteredPayments = React.useMemo(() => {
        if (params.method === "ALL") return payments;
        return payments.filter((payment) => payment.method === params.method);
    }, [payments, params.method]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Cargando historial...</p>
            </div>
        );
    }

    // Filter component for payment method
    const filterComponent = (
        <Select value={params.method} onValueChange={(value) => setParams({ method: value })}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Todos los métodos</SelectItem>
                <SelectItem value="CASH">Efectivo</SelectItem>
                <SelectItem value="CARD">Tarjeta</SelectItem>
                <SelectItem value="YAPE">Yape</SelectItem>
                <SelectItem value="PLIN">Plin</SelectItem>
                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                <SelectItem value="MIXED">Mixto</SelectItem>
            </SelectContent>
        </Select>
    );

    return (
        <>
            <DataTable
                columns={columns}
                data={filteredPayments}
                searchKey="order.orderNumber"
                searchPlaceholder="Buscar por número de orden..."
                filterComponent={filterComponent}
            />

            <ReceiptPreview
                open={showReceipt}
                onOpenChange={setShowReceipt}
                data={receiptData}
            />
        </>
    );
}
