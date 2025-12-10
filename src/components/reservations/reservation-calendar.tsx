"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { ReservationWithTable } from "./columns"
import type { Table, Zone } from "@prisma/client"

interface ReservationCalendarProps {
  reservations: ReservationWithTable[]
  tables: (Table & { zone: Zone | null })[]
  onEdit: (reservation: ReservationWithTable) => void
  onCreateNew: (date: Date, tableId?: string) => void
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 border-amber-300 text-amber-800",
  CONFIRMED: "bg-green-100 border-green-300 text-green-800",
  CANCELLED: "bg-red-100 border-red-300 text-red-800",
  COMPLETED: "bg-gray-100 border-gray-300 text-gray-600",
  NO_SHOW: "bg-red-50 border-red-200 text-red-600",
}

export function ReservationCalendar({
  reservations,
  tables,
  onEdit,
  onCreateNew,
}: ReservationCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    return startOfWeek(today, { weekStartsOn: 1 }) // Monday
  })

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7))
  }

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7))
  }

  const goToToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  // Group reservations by day
  const reservationsByDay = useMemo(() => {
    const grouped: Record<string, ReservationWithTable[]> = {}

    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd")
      grouped[dayKey] = reservations.filter((r) =>
        isSameDay(new Date(r.date), day) && r.status !== "CANCELLED"
      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })

    return grouped
  }, [reservations, weekDays])

  const isToday = (date: Date) => isSameDay(date, new Date())

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Calendario de Reservaciones</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[180px] text-center">
              {format(weekStart, "d MMM", { locale: es })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "text-center p-2 rounded-t-lg border-b-2",
                isToday(day)
                  ? "bg-primary/10 border-primary"
                  : "bg-muted/50 border-transparent"
              )}
            >
              <div className="text-xs font-medium text-muted-foreground uppercase">
                {format(day, "EEE", { locale: es })}
              </div>
              <div className={cn(
                "text-lg font-bold",
                isToday(day) && "text-primary"
              )}>
                {format(day, "d")}
              </div>
            </div>
          ))}

          {/* Day Content */}
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd")
            const dayReservations = reservationsByDay[dayKey] || []

            return (
              <div
                key={`content-${day.toISOString()}`}
                className={cn(
                  "min-h-[200px] p-1 space-y-1 border rounded-b-lg",
                  isToday(day) && "border-primary/50"
                )}
              >
                {dayReservations.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      Sin reservas
                    </span>
                  </div>
                ) : (
                  dayReservations.map((reservation) => (
                    <button
                      key={reservation.id}
                      onClick={() => onEdit(reservation)}
                      className={cn(
                        "w-full p-2 rounded border text-left transition-all hover:shadow-md",
                        statusColors[reservation.status]
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">
                          {format(new Date(reservation.date), "HH:mm")}
                        </span>
                        <Badge variant="outline" className="text-[10px] py-0 h-4">
                          Mesa {reservation.table.number}
                        </Badge>
                      </div>
                      <div className="text-xs font-medium truncate">
                        {reservation.customerName}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] opacity-75">
                        <Users className="h-3 w-3" />
                        {reservation.guests}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <span className="text-xs text-muted-foreground">Estados:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-200 border border-amber-400" />
            <span className="text-xs">Pendiente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-200 border border-green-400" />
            <span className="text-xs">Confirmada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-200 border border-gray-400" />
            <span className="text-xs">Completada</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
