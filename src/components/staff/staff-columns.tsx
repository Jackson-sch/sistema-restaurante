'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    WAITER: 'Mesero',
    CASHIER: 'Cajero',
    KITCHEN: 'Cocina',
    USER: 'Usuario',
};

const roleColors: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
    ADMIN: 'destructive',
    MANAGER: 'default',
    WAITER: 'secondary',
    CASHIER: 'outline',
    KITCHEN: 'secondary',
    USER: 'outline',
};

export function createStaffColumns(
    onEdit: (staff: any) => void,
    onToggleStatus: (id: string) => void,
    onDelete: (id: string) => void
): ColumnDef<any>[] {
    return [
        {
            accessorKey: 'name',
            header: 'Personal',
            cell: ({ row }) => {
                const name = row.getValue('name') as string;
                const email = row.original.email;
                const image = row.original.image;
                const initials = name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || '??';

                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={image} alt={name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{name}</div>
                            <div className="text-sm text-muted-foreground">{email}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'role',
            header: 'Rol',
            cell: ({ row }) => {
                const role = row.getValue('role') as string;
                return (
                    <Badge variant={roleColors[role] || 'outline'}>
                        {roleLabels[role] || role}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'active',
            header: 'Estado',
            cell: ({ row }) => {
                const active = row.getValue('active') as boolean;
                return (
                    <Badge variant={active ? 'default' : 'secondary'}>
                        {active ? 'Activo' : 'Inactivo'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: 'Fecha de Registro',
            cell: ({ row }) => {
                const date = row.getValue('createdAt') as Date;
                return format(new Date(date), 'dd/MM/yyyy', { locale: es });
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const staff = row.original;

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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(staff)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onToggleStatus(staff.id)}>
                                <Power className="mr-2 h-4 w-4" />
                                {staff.active ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(staff.id)}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
}
