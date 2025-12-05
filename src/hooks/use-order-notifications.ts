"use client"

import { useEffect, useRef, useState } from "react"

interface Order {
  id: string
  createdAt: Date
  [key: string]: any
}

interface UseOrderNotificationsReturn {
  newOrders: Order[]
  markAsRead: () => void
  hasUnreadOrders: boolean
}

export function useOrderNotifications(orders: Order[]): UseOrderNotificationsReturn {
  const previousOrderIdsRef = useRef<Set<string>>(new Set())
  const [newOrders, setNewOrders] = useState<Order[]>([])
  const isFirstRender = useRef(true)

  useEffect(() => {
    // En el primer render, solo guardamos los IDs actuales sin notificar
    if (isFirstRender.current) {
      const currentIds = new Set(orders.map(o => o.id))
      previousOrderIdsRef.current = currentIds
      isFirstRender.current = false
      return
    }

    // Detectar nuevos pedidos comparando IDs
    const currentIds = new Set(orders.map(o => o.id))
    const newOrdersList = orders.filter(order => !previousOrderIdsRef.current.has(order.id))

    if (newOrdersList.length > 0) {
      setNewOrders(prev => [...prev, ...newOrdersList])
    }

    previousOrderIdsRef.current = currentIds
  }, [orders])

  const markAsRead = () => {
    setNewOrders([])
  }

  return {
    newOrders,
    markAsRead,
    hasUnreadOrders: newOrders.length > 0
  }
}
