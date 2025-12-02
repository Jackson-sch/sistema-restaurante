import { prisma } from '../src/lib/prisma'

async function checkOrderDates() {
  try {
    console.log('=== CHECKING ORDER DATES ===\n')

    // Get all orders from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        total: true,
        status: true
      }
    })

    console.log(`Found ${orders.length} orders in the last 7 days:\n`)

    orders.forEach((order) => {
      const date = new Date(order.createdAt)

      // Show both UTC and local time
      console.log(`Order: ${order.orderNumber}`)
      console.log(`  ID: ${order.id}`)
      console.log(`  Total: S/ ${order.total}`)
      console.log(`  Status: ${order.status}`)
      console.log(`  Created (UTC): ${date.toISOString()}`)
      console.log(`  Created (Local): ${date.toLocaleString('es-PE', { timeZone: 'America/Lima' })}`)
      console.log(`  Date only (Local): ${date.toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}`)
      console.log(`  Time only (Local): ${date.toLocaleTimeString('es-PE', { timeZone: 'America/Lima' })}`)
      console.log('---')
    })

    // Group by date
    const ordersByDate = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt)
      const dateKey = date.toLocaleDateString('es-PE', { timeZone: 'America/Lima' })

      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(order)
      return acc
    }, {} as Record<string, typeof orders>)

    console.log('\n=== ORDERS GROUPED BY DATE (Local Time) ===\n')
    Object.entries(ordersByDate).forEach(([date, orders]) => {
      const total = orders.reduce((sum, order) => sum + Number(order.total), 0)
      console.log(`${date}: ${orders.length} orders, Total: S/ ${total.toFixed(2)}`)
      orders.forEach(order => {
        console.log(`  - ${order.orderNumber}: S/ ${order.total}`)
      })
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrderDates()
