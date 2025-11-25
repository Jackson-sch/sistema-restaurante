import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixTableStatuses() {
    console.log('🔧 Fixing table statuses...')

    // Find all tables with active orders
    const tablesWithActiveOrders = await prisma.table.findMany({
        where: {
            orders: {
                some: {
                    status: {
                        notIn: ['COMPLETED', 'CANCELLED']
                    }
                }
            }
        },
        include: {
            orders: {
                where: {
                    status: {
                        notIn: ['COMPLETED', 'CANCELLED']
                    }
                }
            }
        }
    })

    console.log(`Found ${tablesWithActiveOrders.length} tables with active orders`)

    // Update tables with active orders to OCCUPIED
    for (const table of tablesWithActiveOrders) {
        if (table.status !== 'OCCUPIED') {
            await prisma.table.update({
                where: { id: table.id },
                data: { status: 'OCCUPIED' }
            })
            console.log(`✅ Updated table ${table.number} to OCCUPIED (had ${table.orders.length} active orders)`)
        }
    }

    // Find all tables without active orders
    const tablesWithoutActiveOrders = await prisma.table.findMany({
        where: {
            NOT: {
                orders: {
                    some: {
                        status: {
                            notIn: ['COMPLETED', 'CANCELLED']
                        }
                    }
                }
            }
        }
    })

    console.log(`Found ${tablesWithoutActiveOrders.length} tables without active orders`)

    // Update tables without active orders to AVAILABLE
    for (const table of tablesWithoutActiveOrders) {
        if (table.status === 'OCCUPIED') {
            await prisma.table.update({
                where: { id: table.id },
                data: { status: 'AVAILABLE' }
            })
            console.log(`✅ Updated table ${table.number} to AVAILABLE (no active orders)`)
        }
    }

    console.log('✨ Done!')
}

fixTableStatuses()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
