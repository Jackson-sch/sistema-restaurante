'use client';

import * as React from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import type { Permission, Role } from '@/lib/permissions';

interface CanProps {
    permission?: Permission;
    permissions?: Permission[];
    requireAll?: boolean; // If true, requires all permissions. If false, requires any permission.
    role?: Role;
    roles?: Role[];
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Component to conditionally render content based on permissions
 * Note: This is for UX only, not security. Always check permissions on the server.
 * 
 * @example
 * <Can permission={PERMISSIONS.ORDERS_CREATE}>
 *   <Button>Create Order</Button>
 * </Can>
 * 
 * @example
 * <Can permissions={[PERMISSIONS.ORDERS_CREATE, PERMISSIONS.ORDERS_UPDATE]} requireAll>
 *   <Button>Manage Orders</Button>
 * </Can>
 * 
 * @example
 * <Can role={ROLES.ADMIN}>
 *   <AdminPanel />
 * </Can>
 */
export function Can({
    permission,
    permissions,
    requireAll = false,
    role,
    roles,
    fallback = null,
    children,
}: CanProps) {
    const {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
    } = usePermissions();

    let allowed = false;

    // Check single permission
    if (permission) {
        allowed = hasPermission(permission);
    }
    // Check multiple permissions
    else if (permissions && permissions.length > 0) {
        allowed = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);
    }
    // Check single role
    else if (role) {
        allowed = hasRole(role);
    }
    // Check multiple roles
    else if (roles && roles.length > 0) {
        allowed = hasAnyRole(roles);
    }

    if (!allowed) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
