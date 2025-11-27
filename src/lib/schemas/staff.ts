import { z } from 'zod';

export const staffRoles = [
    'ADMIN',
    'MANAGER',
    'WAITER',
    'CASHIER',
    'KITCHEN',
    'USER',
] as const;

export const staffSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
    role: z.enum(staffRoles),
    image: z.string().optional(),
    active: z.boolean().default(true),
});

export type StaffInput = z.infer<typeof staffSchema>;

export const createStaffSchema = staffSchema.extend({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const updateStaffSchema = staffSchema.partial().extend({
    id: z.string(),
});
