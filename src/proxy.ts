import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"

// Define protected routes and their required roles/permissions
// We use regex for path matching
const PROTECTED_ROUTES = [
    {
        pattern: /^\/dashboard\/orders(\/.*)?$/,
        // Orders: Waiter, Manager, Admin, Cashier (view only)
        // Kitchen has ORDERS_VIEW but we want to restrict the main list
        // So we check for roles that should have access to the main list
        allowedRoles: ["ADMIN", "MANAGER", "WAITER", "CASHIER"],
        // Kitchen is excluded from the main orders list
    },
    {
        pattern: /^\/dashboard\/menu\/categories(\/.*)?$/,
        // Categories: Admin, Manager
        allowedRoles: ["ADMIN", "MANAGER"],
    },
    {
        pattern: /^\/dashboard\/payments(\/.*)?$/,
        // Payments: Admin, Manager, Cashier, Waiter (view)
        allowedRoles: ["ADMIN", "MANAGER", "CASHIER", "WAITER"],
    },
    {
        pattern: /^\/dashboard\/cash-register(\/.*)?$/,
        // Cash Register: Admin, Manager, Cashier
        allowedRoles: ["ADMIN", "MANAGER", "CASHIER"],
    },
    {
        pattern: /^\/dashboard\/tables(\/.*)?$/,
        // Tables: Admin, Manager, Waiter, Cashier (view)
        allowedRoles: ["ADMIN", "MANAGER", "WAITER", "CASHIER"],
    },
    {
        pattern: /^\/dashboard\/zones(\/.*)?$/,
        // Zones: Admin, Manager
        allowedRoles: ["ADMIN", "MANAGER"],
    },
    {
        pattern: /^\/dashboard\/staff(\/.*)?$/,
        // Staff: Admin, Manager
        allowedRoles: ["ADMIN", "MANAGER"],
    },
    {
        pattern: /^\/dashboard\/settings(\/.*)?$/,
        // Settings: Admin, Manager
        allowedRoles: ["ADMIN", "MANAGER"],
    },
    {
        pattern: /^\/dashboard\/reports(\/.*)?$/,
        // Reports: Admin, Manager
        allowedRoles: ["ADMIN", "MANAGER"],
    },
]

export async function proxy(request: NextRequest) {
    const session = await auth()
    const path = request.nextUrl.pathname

    // 1. Check if user is authenticated for any dashboard route
    if (path.startsWith("/dashboard")) {
        if (!session?.user) {
            return NextResponse.redirect(new URL("/login", request.url))
        }
    }

    // 2. Check role-based access for specific routes
    if (session?.user?.role) {
        const userRole = session.user.role

        // Admin has access to everything
        if (userRole === "ADMIN") {
            return NextResponse.next()
        }

        // Check against protected routes
        for (const route of PROTECTED_ROUTES) {
            if (route.pattern.test(path)) {
                if (!route.allowedRoles.includes(userRole)) {
                    // User does not have permission for this route
                    // Redirect to dashboard root
                    return NextResponse.redirect(new URL("/dashboard", request.url))
                }
            }
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // Match all dashboard routes
        "/dashboard/:path*",
    ],
}
