"use client"

import { useEffect, useRef, useCallback } from "react"

export interface KitchenOrder {
  id: string
  orderNumber: string
  type: string
  status: string
  table?: { number: number } | null
  createdAt: Date
  items: Array<{
    id: string
    quantity: number
    notes?: string | null
    product: {
      name: string
    }
    modifiers: Array<{
      modifier: { name: string }
    }>
  }>
}

interface UseKitchenStreamOptions {
  onNewOrder?: (orders: KitchenOrder[]) => void
  onConnected?: () => void
  onError?: (error: Event) => void
  enabled?: boolean
}

export function useKitchenStream({
  onNewOrder,
  onConnected,
  onError,
  enabled = true,
}: UseKitchenStreamOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!enabled) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource("/api/kitchen/stream")
    eventSourceRef.current = eventSource

    eventSource.addEventListener("connected", () => {
      reconnectAttempts.current = 0
      onConnected?.()
    })

    eventSource.addEventListener("new-order", (event) => {
      try {
        const orders = JSON.parse(event.data) as KitchenOrder[]
        onNewOrder?.(orders)
      } catch (error) {
        console.error("Error parsing new-order event:", error)
      }
    })

    eventSource.onerror = (error) => {
      onError?.(error)
      eventSource.close()

      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++

        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }
    }
  }, [enabled, onNewOrder, onConnected, onError])

  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  return { disconnect }
}
