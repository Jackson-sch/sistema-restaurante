'use client';

import * as React from 'react';
import { getStaff, deleteStaff, toggleStaffStatus } from '@/actions/staff';
import { DataTable } from '@/components/ui/data-table';
import { createStaffColumns } from '@/components/staff/staff-columns';
import { StaffDialog } from '@/components/staff/staff-dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function StaffPage() {
    const [staff, setStaff] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [selectedStaff, setSelectedStaff] = React.useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [staffToDelete, setStaffToDelete] = React.useState<string | null>(null);
    const [roleFilter, setRoleFilter] = React.useState<string>('ALL');
    const [statusFilter, setStatusFilter] = React.useState<string>('ALL');

    React.useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        setLoading(true);
        const data = await getStaff();
        setStaff(data);
        setLoading(false);
    };

    const handleEdit = (staff: any) => {
        setSelectedStaff(staff);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedStaff(null);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (id: string) => {
        const result = await toggleStaffStatus(id);
        if (result.success) {
            toast.success('Estado actualizado correctamente');
            loadStaff();
        } else {
            toast.error(result.error || 'Error al actualizar el estado');
        }
    };

    const handleDeleteClick = (id: string) => {
        setStaffToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!staffToDelete) return;

        const result = await deleteStaff(staffToDelete);
        if (result.success) {
            toast.success('Personal eliminado correctamente');
            loadStaff();
        } else {
            toast.error(result.error || 'Error al eliminar el personal');
        }
        setDeleteDialogOpen(false);
        setStaffToDelete(null);
    };

    const columns = createStaffColumns(handleEdit, handleToggleStatus, handleDeleteClick);

    // Filter staff by role and status
    const filteredStaff = React.useMemo(() => {
        return staff.filter((s) => {
            const roleMatch = roleFilter === 'ALL' || s.role === roleFilter;
            const statusMatch =
                statusFilter === 'ALL' ||
                (statusFilter === 'ACTIVE' && s.active) ||
                (statusFilter === 'INACTIVE' && !s.active);
            return roleMatch && statusMatch;
        });
    }, [staff, roleFilter, statusFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Cargando personal...</p>
            </div>
        );
    }

    const filterComponent = (
        <div className="flex flex-wrap gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px] md:w-[150px]">
                    <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Todos los roles</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="MANAGER">Gerente</SelectItem>
                    <SelectItem value="WAITER">Mesero</SelectItem>
                    <SelectItem value="CASHIER">Cajero</SelectItem>
                    <SelectItem value="KITCHEN">Cocina</SelectItem>
                    <SelectItem value="USER">Usuario</SelectItem>
                </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[100px] md:w-[130px]">
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="ACTIVE">Activos</SelectItem>
                    <SelectItem value="INACTIVE">Inactivos</SelectItem>
                </SelectContent>
            </Select>

            <Button onClick={handleCreate} size="sm">
                <Plus className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Nuevo</span>
            </Button>
        </div>
    );

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Personal</h1>
                <p className="text-muted-foreground">
                    Administra los usuarios y roles del restaurante
                </p>
            </div>

            <div className="overflow-x-auto">
                <DataTable
                    columns={columns}
                    data={filteredStaff}
                    searchPlaceholder="Buscar por nombre o email..."
                    filterComponent={filterComponent}
                />
            </div>

            <StaffDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                staff={selectedStaff}
                onSuccess={loadStaff}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción desactivará al personal. Podrás reactivarlo más tarde si es necesario.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
