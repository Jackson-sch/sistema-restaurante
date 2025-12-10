import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ReservationsClient } from "@/components/reservations/reservations-client"

export default async function ReservationsPage() {
  const session = await auth()

  if (!session?.user?.restaurantId) {
    redirect("/login")
  }

  // Fetch reservations
  const reservations = await prisma.reservation.findMany({
    where: {
      table: {
        restaurantId: session.user.restaurantId,
      },
    },
    include: {
      table: {
        include: {
          zone: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  // Fetch tables for the form
  const tables = await prisma.table.findMany({
    where: {
      restaurantId: session.user.restaurantId,
    },
    include: {
      zone: true,
    },
    orderBy: [
      { zone: { order: 'asc' } },
      { number: 'asc' },
    ],
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las reservas de mesas del restaurante
          </p>
        </div>
      </div>

      <ReservationsClient
        initialReservations={reservations}
        tables={tables}
      />
    </div>
  )
}
