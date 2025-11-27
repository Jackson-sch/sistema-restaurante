'use client';

import { useSession } from 'next-auth/react';
import { roleHasPermission, type Permission, type Role, ROLES } from '@/lib/permissions';

/**
 * Hook to check permissions on the client side
 * Note: This is for UX only, not security. Always check permissions on the server.
 */
export function usePermissions() {
    const { data: session } = useSession();
    const userRole = (session?.user?.role as Role) || null;

    const hasPermission = (permission: Permission): boolean => {
        if (!userRole) return false;
        if (userRole === ROLES.ADMIN) return true;
        return roleHasPermission(userRole, permission);
    };

    const hasAnyPermission = (permissions: Permission[]): boolean => {
        if (!userRole) return false;
        if (userRole === ROLES.ADMIN) return true;
        return permissions.some(permission => roleHasPermission(userRole, permission));
    };

    const hasAllPermissions = (permissions: Permission[]): boolean => {
        if (!userRole) return false;
        if (userRole === ROLES.ADMIN) return true;
        return permissions.every(permission => roleHasPermission(userRole, permission));
    };

    const hasRole = (role: Role): boolean => {
        return userRole === role;
    };

    const hasAnyRole = (roles: Role[]): boolean => {
        if (!userRole) return false;
        return roles.includes(userRole);
    };

    const isAdmin = (): boolean => {
        return userRole === ROLES.ADMIN;
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
        isAdmin,
        userRole,
    };
}
