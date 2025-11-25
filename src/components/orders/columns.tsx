'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Order, Table, User } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Define the shape of the data for the table
// Override Decimal fields with number for client component serialization
export type OrderColumn = Omit<Order, 'subtotal' | 'tax' | 'discount' | 'tip' | 'total'> & {
    table: Table | null;
    user: User | null;
    subtotal: number;
    tax: number;
    discount: number;
    tip: number;
    total: number;
};

import { createSortableHeader } from '@/lib/table-utils';

export const columns: ColumnDef<OrderColumn>[] = [
    {
        accessorKey: 'orderNumber',
        header: createSortableHeader('N° Orden'),
        cell: ({ row }) => <div className="font-medium">{row.getValue('orderNumber')}</div>,
    },
    {
        accessorKey: 'type',
        header: createSortableHeader('Tipo'),
        cell: ({ row }) => {
            const type = row.getValue('type') as string;
            return (
                <Badge variant="outline">
                    {type === 'DINE_IN' ? 'Mesa' : type === 'TAKEOUT' ? 'Para llevar' : 'Delivery'}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'table',
        header: createSortableHeader('Mesa'),
        cell: ({ row }) => {
            const table = row.original.table;
            return table ? <div>{table.number}</div> : <span className="text-muted-foreground">-</span>;
        },
    },
    {
        accessorKey: 'status',
        header: createSortableHeader('Estado'),
        cell: ({ row }) => {
            const status = row.getValue('status') as string;
            const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                PENDING: 'secondary',
                CONFIRMED: 'default',
                PREPARING: 'default',
                READY: 'default',
                SERVED: 'default',
                COMPLETED: 'outline',
                CANCELLED: 'destructive',
            };

            const labels: Record<string, string> = {
                PENDING: 'Pendiente',
                CONFIRMED: 'Confirmado',
                PREPARING: 'Preparando',
                READY: 'Listo',
                SERVED: 'Servido',
                COMPLETED: 'Completado',
                CANCELLED: 'Cancelado',
            };

            return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
        },
    },
    {
        accessorKey: 'total',
        header: createSortableHeader('Total'),
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('total'));
            return <div className="font-medium">{formatCurrency(amount)}</div>;
        },
    },
    {
        accessorKey: 'createdAt',
        header: createSortableHeader('Fecha'),
        cell: ({ row }) => {
            return (
                <div className="text-muted-foreground text-sm">
                    {format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy HH:mm', { locale: es })}
                </div>
            );
        },
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const order = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/orders/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
