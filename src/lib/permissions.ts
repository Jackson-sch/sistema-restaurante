// Permission constants organized by module
export const PERMISSIONS = {
    // Orders
    ORDERS_CREATE: 'orders.create',
    ORDERS_VIEW: 'orders.view',
    ORDERS_UPDATE: 'orders.update',
    ORDERS_CANCEL: 'orders.cancel',
    ORDERS_DELETE: 'orders.delete',

    // Products
    PRODUCTS_CREATE: 'products.create',
    PRODUCTS_VIEW: 'products.view',
    PRODUCTS_UPDATE: 'products.update',
    PRODUCTS_DELETE: 'products.delete',

    // Categories
    CATEGORIES_CREATE: 'categories.create',
    CATEGORIES_VIEW: 'categories.view',
    CATEGORIES_UPDATE: 'categories.update',
    CATEGORIES_DELETE: 'categories.delete',

    // Tables
    TABLES_CREATE: 'tables.create',
    TABLES_VIEW: 'tables.view',
    TABLES_UPDATE: 'tables.update',
    TABLES_DELETE: 'tables.delete',

    // Zones
    ZONES_CREATE: 'zones.create',
    ZONES_VIEW: 'zones.view',
    ZONES_UPDATE: 'zones.update',
    ZONES_DELETE: 'zones.delete',

    // Payments
    PAYMENTS_CREATE: 'payments.create',
    PAYMENTS_VIEW: 'payments.view',
    PAYMENTS_REFUND: 'payments.refund',

    // Cash Register
    CASH_REGISTER_OPEN: 'cash_register.open',
    CASH_REGISTER_CLOSE: 'cash_register.close',
    CASH_REGISTER_VIEW: 'cash_register.view',
    CASH_REGISTER_MANAGE: 'cash_register.manage',

    // Staff
    STAFF_CREATE: 'staff.create',
    STAFF_VIEW: 'staff.view',
    STAFF_UPDATE: 'staff.update',
    STAFF_DELETE: 'staff.delete',

    // Reports
    REPORTS_SALES: 'reports.sales',
    REPORTS_INVENTORY: 'reports.inventory',
    REPORTS_STAFF: 'reports.staff',

    // Inventory
    INVENTORY_VIEW: 'inventory.view',
    INVENTORY_CREATE: 'inventory.create',
    INVENTORY_UPDATE: 'inventory.update',
    INVENTORY_DELETE: 'inventory.delete',
    INVENTORY_ADJUST: 'inventory.adjust',

    // Settings
    SETTINGS_VIEW: 'settings.view',
    SETTINGS_UPDATE: 'settings.update',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role definitions
export const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    WAITER: 'WAITER',
    CASHIER: 'CASHIER',
    KITCHEN: 'KITCHEN',
    USER: 'USER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Role-Permission mappings
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [ROLES.ADMIN]: Object.values(PERMISSIONS), // ADMIN has all permissions

    [ROLES.MANAGER]: [
        // Orders
        PERMISSIONS.ORDERS_CREATE,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.ORDERS_UPDATE,
        PERMISSIONS.ORDERS_CANCEL,
        PERMISSIONS.ORDERS_DELETE,
        // Products & Categories
        PERMISSIONS.PRODUCTS_CREATE,
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.PRODUCTS_UPDATE,
        PERMISSIONS.PRODUCTS_DELETE,
        PERMISSIONS.CATEGORIES_CREATE,
        PERMISSIONS.CATEGORIES_VIEW,
        PERMISSIONS.CATEGORIES_UPDATE,
        PERMISSIONS.CATEGORIES_DELETE,
        // Tables & Zones
        PERMISSIONS.TABLES_CREATE,
        PERMISSIONS.TABLES_VIEW,
        PERMISSIONS.TABLES_UPDATE,
        PERMISSIONS.TABLES_DELETE,
        PERMISSIONS.ZONES_CREATE,
        PERMISSIONS.ZONES_VIEW,
        PERMISSIONS.ZONES_UPDATE,
        PERMISSIONS.ZONES_DELETE,
        // Payments
        PERMISSIONS.PAYMENTS_CREATE,
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.PAYMENTS_REFUND,
        // Cash Register
        PERMISSIONS.CASH_REGISTER_VIEW,
        PERMISSIONS.CASH_REGISTER_MANAGE,
        // Staff
        PERMISSIONS.STAFF_CREATE,
        PERMISSIONS.STAFF_VIEW,
        PERMISSIONS.STAFF_UPDATE,
        // Reports
        PERMISSIONS.REPORTS_SALES,
        PERMISSIONS.REPORTS_INVENTORY,
        PERMISSIONS.REPORTS_STAFF,
        // Inventory
        PERMISSIONS.INVENTORY_VIEW,
        PERMISSIONS.INVENTORY_CREATE,
        PERMISSIONS.INVENTORY_UPDATE,
        PERMISSIONS.INVENTORY_DELETE,
        PERMISSIONS.INVENTORY_ADJUST,
        // Settings
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.SETTINGS_UPDATE,
    ],

    [ROLES.WAITER]: [
        // Orders
        PERMISSIONS.ORDERS_CREATE,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.ORDERS_UPDATE,
        // Products (view only)
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.CATEGORIES_VIEW,
        // Tables
        PERMISSIONS.TABLES_VIEW,
        PERMISSIONS.TABLES_UPDATE,
        // Payments (view only)
        PERMISSIONS.PAYMENTS_VIEW,
    ],

    [ROLES.CASHIER]: [
        // Orders
        PERMISSIONS.ORDERS_CREATE,
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.ORDERS_UPDATE,
        // Products (view only)
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.CATEGORIES_VIEW,
        // Tables
        PERMISSIONS.TABLES_VIEW,
        // Payments
        PERMISSIONS.PAYMENTS_CREATE,
        PERMISSIONS.PAYMENTS_VIEW,
        // Cash Register
        PERMISSIONS.CASH_REGISTER_OPEN,
        PERMISSIONS.CASH_REGISTER_CLOSE,
        PERMISSIONS.CASH_REGISTER_VIEW,
    ],

    [ROLES.KITCHEN]: [
        // Orders (view and update status)
        PERMISSIONS.ORDERS_VIEW,
        PERMISSIONS.ORDERS_UPDATE,
        // Products (view only)
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.CATEGORIES_VIEW,
    ],

    [ROLES.USER]: [
        // Orders (view only)
        PERMISSIONS.ORDERS_VIEW,
        // Products (view only)
        PERMISSIONS.PRODUCTS_VIEW,
        PERMISSIONS.CATEGORIES_VIEW,
    ],
};

// Helper to get permissions for a role
export function getPermissionsForRole(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}

// Helper to check if a role has a specific permission
export function roleHasPermission(role: Role, permission: Permission): boolean {
    if (role === ROLES.ADMIN) return true; // ADMIN always has all permissions
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}
