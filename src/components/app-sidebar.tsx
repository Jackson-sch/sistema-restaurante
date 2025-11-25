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
  Wallet
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
      title: "Configuración",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ user, restaurant, ...props }: React.ComponentProps<typeof Sidebar> & { user?: any, restaurant?: any }) {
  // Use passed user or fallback to default
  const userData = user ? { name: user.name, email: user.email, avatar: user.image || "" } : data.user

  const teams = restaurant ? [
    {
      name: restaurant.name,
      logo: restaurant.logo || UtensilsCrossed,
      plan: restaurant.businessType || "Restaurante",
    }
  ] : data.teams

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
