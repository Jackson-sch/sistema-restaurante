'use client';

import * as React from 'react';
import { DataTable } from '@/components/ui/data-table';
import { createPaymentColumns } from './payment-columns';
import { getPaymentHistory } from '@/actions/payments';
import { getReceiptData } from '@/actions/receipts';
import { ReceiptPreview } from '@/components/receipts/receipt-preview';
import { ReceiptData } from '@/types/receipt';
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs';
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
    const [totalPages, setTotalPages] = React.useState(1);
    const [searchValue, setSearchValue] = React.useState('');

    const [params, setParams] = useQueryStates({
        method: parseAsString.withDefault('ALL'),
        page: parseAsInteger.withDefault(1),
        pageSize: parseAsInteger.withDefault(10),
    });

    const loadPayments = React.useCallback(async () => {
        setLoading(true);
        const result = await getPaymentHistory({
            page: params.page,
            limit: params.pageSize,
            method: params.method !== 'ALL' ? params.method : undefined,
            search: searchValue || undefined,
        });
        setPayments(result.data);
        setTotalPages(result.meta.totalPages);
        setLoading(false);
    }, [params.page, params.pageSize, params.method, searchValue]);

    React.useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (params.page !== 1) {
                setParams({ page: 1 }); // Reset to page 1 on search
            } else {
                loadPayments();
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchValue]);

    const handleReprint = async (paymentId: string) => {
        const receipt = await getReceiptData(paymentId);
        if (receipt) {
            setReceiptData(receipt);
            setShowReceipt(true);
        }
    };

    const columns = createPaymentColumns(handleReprint);

    // Filter component for payment method
    const filterComponent = (
        <Select
            value={params.method}
            onValueChange={(value) => setParams({ method: value, page: 1 })}
        >
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
                data={payments}
                searchPlaceholder="Buscar por número de orden..."
                filterComponent={filterComponent}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                pageCount={totalPages}
                currentPage={params.page}
                onPageChange={(page) => setParams({ page })}
                onPageSizeChange={(pageSize) => setParams({ pageSize, page: 1 })}
            />

            <ReceiptPreview
                open={showReceipt}
                onOpenChange={setShowReceipt}
                data={receiptData}
            />
        </>
    );
}
