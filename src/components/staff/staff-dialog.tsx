'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { staffSchema, staffRoles, type StaffInput } from '@/lib/schemas/staff';
import { createStaff, updateStaff } from '@/actions/staff';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface StaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff?: any; // For editing
    onSuccess?: () => void;
}

const roleLabels: Record<typeof staffRoles[number], string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    WAITER: 'Mesero',
    CASHIER: 'Cajero',
    KITCHEN: 'Cocina',
    USER: 'Usuario',
};

export function StaffDialog({ open, onOpenChange, staff, onSuccess }: StaffDialogProps) {
    const [loading, setLoading] = React.useState(false);
    const isEditing = !!staff;

    const form = useForm({
        resolver: zodResolver(staffSchema),
        defaultValues: {
            name: staff?.name || '',
            email: staff?.email || '',
            password: '',
            role: staff?.role || 'USER',
            image: staff?.image || '',
            active: staff?.active ?? true,
        },
    });

    React.useEffect(() => {
        if (staff) {
            form.reset({
                name: staff.name || '',
                email: staff.email || '',
                password: '',
                role: staff.role || 'USER',
                image: staff.image || '',
                active: staff.active ?? true,
            });
        } else {
            form.reset({
                name: '',
                email: '',
                password: '',
                role: 'USER',
                image: '',
                active: true,
            });
        }
    }, [staff, form]);

    const onSubmit = async (data: StaffInput) => {
        setLoading(true);

        try {
            let result;

            if (isEditing) {
                // For editing, only send password if it's provided
                const updateData: any = {
                    id: staff.id,
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    image: data.image,
                    active: data.active,
                };

                if (data.password && data.password.length > 0) {
                    updateData.password = data.password;
                }

                result = await updateStaff(updateData);
            } else {
                result = await createStaff(data);
            }

            if (result.success) {
                toast.success(isEditing ? 'Personal actualizado correctamente' : 'Personal creado correctamente');
                onOpenChange(false);
                form.reset();
                onSuccess?.();
            } else {
                toast.error(result.error || 'Error al guardar el personal');
            }
        } catch (error) {
            toast.error('Error al guardar el personal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Personal' : 'Nuevo Personal'}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Actualiza la información del personal'
                            : 'Completa los datos para crear un nuevo miembro del personal'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Juan Pérez" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Contraseña {isEditing && '(dejar en blanco para mantener la actual)'}
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder={isEditing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rol</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un rol" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {staffRoles.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {roleLabels[role]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                        <FormLabel>Estado</FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                            {field.value ? 'Activo' : 'Inactivo'}
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Actualizar' : 'Crear'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
