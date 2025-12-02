"use client"

import * as React from "react"
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  Map,
  Users,
  Settings,
  ChefHat,
  History,
  PlusCircle,
  List,
  Grid,
  Wallet,
  BarChart,
  TrendingUp
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "Usuario",
    email: "usuario@ejemplo.com",
    avatar: "",
  },
  teams: [
    {
      name: "Restaurante",
      logo: UtensilsCrossed,
      plan: "Principal",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Analítica",
      url: "/dashboard/analytics",
      icon: TrendingUp,
    },
    {
      title: "Menú",
      url: "/dashboard/menu",
      icon: UtensilsCrossed,
      items: [
        {
          title: "Platos",
          url: "/dashboard/menu/dishes",
        },
        {
          title: "Categorías",
          url: "/dashboard/menu/categories",
        },
      ],
    },
    {
      title: "Cocina",
      url: "/dashboard/kitchen",
      icon: ChefHat,
    },
    {
      title: "Pedidos",
      url: "/dashboard/orders",
      icon: ClipboardList,
      items: [
        {
          title: "Lista de Pedidos",
          url: "/dashboard/orders",
        },
        {
          title: "Historial",
          url: "/dashboard/orders/history",
        },
      ],
    },
    {
      title: "Pagos",
      url: "/dashboard/payments",
      icon: Wallet,
    },
    {
      title: "Caja",
      url: "/dashboard/cash-register",
      icon: Wallet,
    },
    {
      title: "Mesas y Zonas",
      url: "/dashboard/tables",
      icon: Map,
      items: [
        {
          title: "Mesas",
          url: "/dashboard/tables",
        },
        {
          title: "Mapa de Mesas",
          url: "/dashboard/tables/map",
        },
        {
          title: "Zonas",
          url: "/dashboard/zones",
        },
      ],
    },
    {
      title: "Personal",
      url: "/dashboard/staff",
      icon: Users,
    },
    {
      title: "Reportes",
      url: "/dashboard/reports",
      icon: BarChart,
    },
    {
      title: "Inventario",
      url: "/dashboard/inventory",
      icon: ClipboardList,
    },
    {
      title: "Configuración",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
}

import { usePermissions } from "@/hooks/use-permissions"
import { PERMISSIONS } from "@/lib/permissions"

export function AppSidebar({ user, restaurant, ...props }: React.ComponentProps<typeof Sidebar> & { user?: any, restaurant?: any }) {
  const { hasPermission } = usePermissions()

  // Use passed user or fallback to default
  const userData = user ? { name: user.name, email: user.email, avatar: user.image || "" } : data.user

  const teams = restaurant ? [
    {
      name: restaurant.name,
      logo: restaurant.logo || UtensilsCrossed,
      plan: restaurant.businessType || "Restaurante",
    }
  ] : data.teams

  // Filter navigation items based on permissions
  const navMain = data.navMain.map(item => ({ ...item, items: item.items ? [...item.items] : undefined })).filter(item => {
    // Dashboard is always visible
    if (item.url === "/dashboard" && !item.items) return true

    // Analytics
    if (item.title === "Analítica") {
      return hasPermission(PERMISSIONS.REPORTS_SALES)
    }

    // Menu (Products/Categories)
    if (item.title === "Menú") {
      // Filter sub-items
      if (item.items) {
        item.items = item.items.filter(subItem => {
          if (subItem.title === "Categorías") {
            // Hide Categories from Kitchen (they have CATEGORIES_VIEW but shouldn't see this admin section)
            // Require CREATE or UPDATE permission which Kitchen lacks
            return hasPermission(PERMISSIONS.CATEGORIES_CREATE) || hasPermission(PERMISSIONS.CATEGORIES_UPDATE)
          }
          return true
        })
      }

      // Only show Menu if there are visible items or if it has no items (shouldn't happen for Menu)
      return (item.items && item.items.length > 0) && (hasPermission(PERMISSIONS.PRODUCTS_VIEW) || hasPermission(PERMISSIONS.CATEGORIES_VIEW))
    }

    // Kitchen
    if (item.title === "Cocina") {
      // Kitchen usually needs to view and update orders
      // But Cashier and Waiter also have ORDERS_UPDATE, so we explicitly exclude them
      if (user?.role === "CASHIER" || user?.role === "WAITER") return false
      return hasPermission(PERMISSIONS.ORDERS_UPDATE)
    }

    // Orders
    if (item.title === "Pedidos") {
      // Hide from Kitchen (they have their own module)
      // Kitchen has ORDERS_VIEW but we want to hide this specific module
      // We can check if they have ORDERS_CREATE (Waiters/Managers) OR CASH_REGISTER_VIEW (Cashiers)
      // This way Kitchen (who has neither) won't see it
      return hasPermission(PERMISSIONS.ORDERS_CREATE) || hasPermission(PERMISSIONS.CASH_REGISTER_VIEW)
    }

    // Payments
    if (item.title === "Pagos") {
      return hasPermission(PERMISSIONS.PAYMENTS_VIEW) || hasPermission(PERMISSIONS.PAYMENTS_CREATE)
    }

    // Cash Register
    if (item.title === "Caja") {
      return hasPermission(PERMISSIONS.CASH_REGISTER_VIEW) || hasPermission(PERMISSIONS.CASH_REGISTER_OPEN)
    }

    // Tables & Zones
    if (item.title === "Mesas y Zonas") {
      // Filter sub-items
      if (item.items) {
        item.items = item.items.filter(subItem => {
          if (subItem.title === "Mesas") {
            return hasPermission(PERMISSIONS.TABLES_VIEW)
          }
          if (subItem.title === "Zonas") {
            return hasPermission(PERMISSIONS.ZONES_VIEW)
          }
          return true
        })
      }

      // Show parent if there are any visible sub-items
      return item.items && item.items.length > 0
    }

    // Staff
    if (item.title === "Personal") {
      return hasPermission(PERMISSIONS.STAFF_VIEW)
    }

    // Reports
    if (item.title === "Reportes") {
      return hasPermission(PERMISSIONS.REPORTS_SALES)
    }

    // Inventory
    if (item.title === "Inventario") {
      return hasPermission(PERMISSIONS.REPORTS_INVENTORY) // Using this permission for now
    }

    // Settings
    if (item.title === "Configuración") {
      return hasPermission(PERMISSIONS.SETTINGS_VIEW)
    }

    return true
  })

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
