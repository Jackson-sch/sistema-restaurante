import { auth } from '@/auth';
import { PERMISSIONS, ROLES, roleHasPermission, type Permission, type Role } from './permissions';

/**
 * Check if the current user has a specific permission
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
    const session = await auth();

    if (!session?.user) {
        return false;
    }

    const userRole = session.user.role as Role;

    // ADMIN always has all permissions
    if (userRole === ROLES.ADMIN) {
        return true;
    }

    return roleHasPermission(userRole, permission);
}

/**
 * Check if the current user has any of the specified permissions
 */
export async function hasAnyPermission(permissions: Permission[]): Promise<boolean> {
    const session = await auth();

    if (!session?.user) {
        return false;
    }

    const userRole = session.user.role as Role;

    // ADMIN always has all permissions
    if (userRole === ROLES.ADMIN) {
        return true;
    }

    return permissions.some(permission => roleHasPermission(userRole, permission));
}

/**
 * Check if the current user has all of the specified permissions
 */
export async function hasAllPermissions(permissions: Permission[]): Promise<boolean> {
    const session = await auth();

    if (!session?.user) {
        return false;
    }

    const userRole = session.user.role as Role;

    // ADMIN always has all permissions
    if (userRole === ROLES.ADMIN) {
        return true;
    }

    return permissions.every(permission => roleHasPermission(userRole, permission));
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: Role): Promise<boolean> {
    const session = await auth();

    if (!session?.user) {
        return false;
    }

    return session.user.role === role;
}

/**
 * Check if the current user has any of the specified roles
 */
export async function hasAnyRole(roles: Role[]): Promise<boolean> {
    const session = await auth();

    if (!session?.user) {
        return false;
    }

    return roles.includes(session.user.role as Role);
}

/**
 * Require a permission - throws error if user doesn't have it
 * Use this in server actions to protect endpoints
 */
export async function requirePermission(permission: Permission): Promise<void> {
    const allowed = await hasPermission(permission);

    if (!allowed) {
        throw new Error('No tienes permisos para realizar esta acción');
    }
}

/**
 * Require any of the specified permissions
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<void> {
    const allowed = await hasAnyPermission(permissions);

    if (!allowed) {
        throw new Error('No tienes permisos para realizar esta acción');
    }
}

/**
 * Require a specific role
 */
export async function requireRole(role: Role): Promise<void> {
    const allowed = await hasRole(role);

    if (!allowed) {
        throw new Error('No tienes permisos para realizar esta acción');
    }
}

/**
 * Require any of the specified roles
 */
export async function requireAnyRole(roles: Role[]): Promise<void> {
    const allowed = await hasAnyRole(roles);

    if (!allowed) {
        throw new Error('No tienes permisos para realizar esta acción');
    }
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole(): Promise<Role | null> {
    const session = await auth();
    return (session?.user?.role as Role) || null;
}

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await auth();
    return !!session?.user;
}

import { redirect } from 'next/navigation';

/**
 * Verify permission or redirect to dashboard
 * Use this in Server Components (Pages)
 */
export async function verifyPermissionOrRedirect(permission: Permission, redirectTo = '/dashboard'): Promise<void> {
    const allowed = await hasPermission(permission);
    if (!allowed) {
        redirect(redirectTo);
    }
}

/**
 * Verify any permission or redirect to dashboard
 * Use this in Server Components (Pages)
 */
export async function verifyAnyPermissionOrRedirect(permissions: Permission[], redirectTo = '/dashboard'): Promise<void> {
    const allowed = await hasAnyPermission(permissions);
    if (!allowed) {
        redirect(redirectTo);
    }
}
