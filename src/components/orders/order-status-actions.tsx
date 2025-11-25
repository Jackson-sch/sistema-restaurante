'use client';

import { updateOrderStatus } from '@/actions/orders';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface OrderStatusActionsProps {
    orderId: string;
    currentStatus: string;
}

export function OrderStatusActions({ orderId, currentStatus }: OrderStatusActionsProps) {
    const router = useRouter();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true);
        try {
            const result = await updateOrderStatus(orderId, newStatus);
            if (result.success) {
                toast.success('Estado actualizado correctamente');
                router.refresh();
            } else {
                toast.error('Error al actualizar el estado');
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado');
        } finally {
            setIsUpdating(false);
        }
    };

    const statusOptions = [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'CONFIRMED', label: 'Confirmado' },
        { value: 'PREPARING', label: 'Preparando' },
        { value: 'READY', label: 'Listo' },
        { value: 'SERVED', label: 'Servido' },
        { value: 'COMPLETED', label: 'Completado' },
        { value: 'CANCELLED', label: 'Cancelado' },
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-medium text-sm">Actualizar Estado</h3>
            <div className="flex gap-2">
                <Select
                    defaultValue={currentStatus}
                    onValueChange={handleStatusChange}
                    disabled={isUpdating}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
