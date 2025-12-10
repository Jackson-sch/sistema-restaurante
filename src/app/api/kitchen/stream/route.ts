import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()

  if (!session?.user?.restaurantId) {
    return new Response("No autorizado", { status: 401 })
  }

  const restaurantId = session.user.restaurantId
  const encoder = new TextEncoder()

  // Track last order ID to detect new orders
  let lastOrderIds: Set<string> = new Set()

  // Initialize with current orders
  const initialOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
    },
    select: { id: true }
  })
  lastOrderIds = new Set(initialOrders.map(o => o.id))

  let isRunning = true
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to safely enqueue data
      const safeEnqueue = (data: Uint8Array) => {
        if (!isRunning) return false
        try {
          controller.enqueue(data)
          return true
        } catch {
          // Controller is closed
          isRunning = false
          return false
        }
      }

      // Send initial connection event
      safeEnqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ message: "Conectado a cocina" })}\n\n`)
      )

      const checkForNewOrders = async () => {
        if (!isRunning) return

        try {
          const currentOrders = await prisma.order.findMany({
            where: {
              restaurantId,
              status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
            },
            include: {
              table: true,
              items: {
                include: {
                  product: true,
                  modifiers: {
                    include: { modifier: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          })

          // Check if still running after async operation
          if (!isRunning) return

          const currentIds = new Set(currentOrders.map(o => o.id))

          // Find new orders (in current but not in last known)
          const newOrders = currentOrders.filter(o => !lastOrderIds.has(o.id))

          if (newOrders.length > 0 && isRunning) {
            // Serialize Decimal fields
            const serializedOrders = newOrders.map(order => ({
              ...order,
              subtotal: Number(order.subtotal),
              tax: Number(order.tax),
              discount: Number(order.discount),
              tip: Number(order.tip),
              total: Number(order.total),
              items: order.items.map(item => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                subtotal: Number(item.subtotal),
                product: {
                  ...item.product,
                  price: Number(item.product.price),
                  cost: Number(item.product.cost || 0),
                },
                modifiers: item.modifiers.map(mod => ({
                  ...mod,
                  price: Number(mod.price),
                  modifier: {
                    ...mod.modifier,
                    price: Number(mod.modifier.price),
                  }
                }))
              }))
            }))

            safeEnqueue(
              encoder.encode(`event: new-order\ndata: ${JSON.stringify(serializedOrders)}\n\n`)
            )
          }

          // Update last known order IDs
          lastOrderIds = currentIds

        } catch (error) {
          // Only log if we're still supposed to be running
          if (isRunning) {
            console.error("SSE check error:", error)
          }
        }

        // Check again in 3 seconds
        if (isRunning) {
          setTimeout(checkForNewOrders, 3000)
        }
      }

      // Send heartbeat every 30 seconds to keep connection alive
      heartbeatInterval = setInterval(() => {
        if (isRunning) {
          safeEnqueue(encoder.encode(`:heartbeat\n\n`))
        } else if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
        }
      }, 30000)

      // Start checking for new orders
      setTimeout(checkForNewOrders, 1000)
    },

    cancel() {
      // Stream was cancelled - cleanup
      isRunning = false
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  })
}
