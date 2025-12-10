'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { OrderDetailSheet } from './order-detail-sheet';
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

export interface OrderWithItems extends OrderColumn {
    items: OrderItem[];
}

interface OrdersDataTableProps {
    columns: ColumnDef<OrderColumn>[];
    data: OrderWithItems[];
    pageCount: number;
    currentPage: number;
}

export function OrdersDataTable({
    columns,
    data,
    pageCount,
    currentPage,
}: OrdersDataTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Sheet state
    const [selectedOrder, setSelectedOrder] = React.useState<OrderWithItems | null>(null);
    const [sheetOpen, setSheetOpen] = React.useState(false);

    // Handle search
    const [searchValue, setSearchValue] = React.useState(searchParams.get('search') || '');

    // Debounce search
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchValue !== (searchParams.get('search') || '')) {
                const params = new URLSearchParams(searchParams.toString());
                if (searchValue) {
                    params.set('search', searchValue);
                } else {
                    params.delete('search');
                }
                params.set('page', '1'); // Reset to page 1 on search
                router.push(`${pathname}?${params.toString()}`);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchValue, router, pathname, searchParams]);

    const handleStatusFilter = (status: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (status && status !== 'ALL') {
            params.set('status', status);
        } else {
            params.delete('status');
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePageSizeChange = (pageSize: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('pageSize', pageSize.toString());
        params.set('page', '1'); // Reset to page 1 when changing page size
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sortBy', sortBy);
        params.set('sortOrder', sortOrder);
        params.set('page', '1'); // Reset to page 1 when changing sort
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleRowClick = (row: OrderWithItems) => {
        setSelectedOrder(row);
        setSheetOpen(true);
    };

    const filterComponent = (
        <Select
            value={searchParams.get('status') || 'ALL'}
            onValueChange={handleStatusFilter}
        >
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                <SelectItem value="PREPARING">Preparando</SelectItem>
                <SelectItem value="READY">Listo</SelectItem>
                <SelectItem value="SERVED">Servido</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
        </Select>
    );

    return (
        <>
            <DataTable
                columns={columns}
                data={data as unknown as OrderColumn[]}
                searchPlaceholder="Buscar por orden o cliente..."
                filterComponent={filterComponent}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                pageCount={pageCount}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                sortBy={searchParams.get('sortBy') || undefined}
                sortOrder={(searchParams.get('sortOrder') as 'asc' | 'desc') || undefined}
                onSortChange={handleSortChange}
                onRowClick={(row) => handleRowClick(row as unknown as OrderWithItems)}
            />
            <OrderDetailSheet
                order={selectedOrder}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
            />
        </>
    );
}

