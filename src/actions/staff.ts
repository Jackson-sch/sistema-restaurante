'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { createStaffSchema, updateStaffSchema } from '@/lib/schemas/staff';
import bcrypt from 'bcryptjs';

/**
 * Get all staff members for the current restaurant
 */
export async function getStaff() {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return [];
    }

    const staff = await prisma.user.findMany({
        where: {
            restaurantId: session.user.restaurantId,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            active: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return staff;
}

/**
 * Create a new staff member
 */
export async function createStaff(data: unknown) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return { success: false, error: 'No autorizado' };
    }

    // Check if user has permission (only ADMIN or MANAGER)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
        return { success: false, error: 'No tienes permisos para crear personal' };
    }

    try {
        const validatedData = createStaffSchema.parse(data);

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return { success: false, error: 'El email ya está registrado' };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        // Create user
        await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: hashedPassword,
                role: validatedData.role,
                image: validatedData.image,
                active: validatedData.active,
                restaurantId: session.user.restaurantId,
            },
        });

        revalidatePath('/dashboard/staff');

        return { success: true };
    } catch (error) {
        console.error('Error creating staff:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Error al crear el personal' };
    }
}

/**
 * Update a staff member
 */
export async function updateStaff(data: unknown) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return { success: false, error: 'No autorizado' };
    }

    // Check if user has permission (only ADMIN or MANAGER)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
        return { success: false, error: 'No tienes permisos para editar personal' };
    }

    try {
        const validatedData = updateStaffSchema.parse(data);
        const { id, ...updateData } = validatedData;

        // Verify the user belongs to the same restaurant
        const existingUser = await prisma.user.findFirst({
            where: {
                id,
                restaurantId: session.user.restaurantId,
            },
        });

        if (!existingUser) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        // If email is being updated, check uniqueness
        if (updateData.email && updateData.email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: updateData.email },
            });

            if (emailExists) {
                return { success: false, error: 'El email ya está registrado' };
            }
        }

        // If password is provided, hash it
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        // Update user
        await prisma.user.update({
            where: { id },
            data: updateData,
        });

        revalidatePath('/dashboard/staff');

        return { success: true };
    } catch (error) {
        console.error('Error updating staff:', error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'Error al actualizar el personal' };
    }
}

/**
 * Delete (soft delete) a staff member
 */
export async function deleteStaff(id: string) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return { success: false, error: 'No autorizado' };
    }

    // Check if user has permission (only ADMIN)
    if (session.user.role !== 'ADMIN') {
        return { success: false, error: 'Solo ADMIN puede eliminar personal' };
    }

    try {
        // Verify the user belongs to the same restaurant
        const existingUser = await prisma.user.findFirst({
            where: {
                id,
                restaurantId: session.user.restaurantId,
            },
        });

        if (!existingUser) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        // Prevent deleting yourself
        if (id === session.user.id) {
            return { success: false, error: 'No puedes eliminarte a ti mismo' };
        }

        // Soft delete by setting active to false
        await prisma.user.update({
            where: { id },
            data: { active: false },
        });

        revalidatePath('/dashboard/staff');

        return { success: true };
    } catch (error) {
        console.error('Error deleting staff:', error);
        return { success: false, error: 'Error al eliminar el personal' };
    }
}

/**
 * Toggle staff active status
 */
export async function toggleStaffStatus(id: string) {
    const session = await auth();

    if (!session?.user?.restaurantId) {
        return { success: false, error: 'No autorizado' };
    }

    // Check if user has permission (only ADMIN or MANAGER)
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
        return { success: false, error: 'No tienes permisos para cambiar el estado del personal' };
    }

    try {
        // Verify the user belongs to the same restaurant
        const existingUser = await prisma.user.findFirst({
            where: {
                id,
                restaurantId: session.user.restaurantId,
            },
        });

        if (!existingUser) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        // Prevent deactivating yourself
        if (id === session.user.id) {
            return { success: false, error: 'No puedes desactivarte a ti mismo' };
        }

        // Toggle active status
        await prisma.user.update({
            where: { id },
            data: { active: !existingUser.active },
        });

        revalidatePath('/dashboard/staff');

        return { success: true };
    } catch (error) {
        console.error('Error toggling staff status:', error);
        return { success: false, error: 'Error al cambiar el estado del personal' };
    }
}
