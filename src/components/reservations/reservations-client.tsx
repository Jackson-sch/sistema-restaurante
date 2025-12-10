"use client"

import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns, type ReservationWithTable } from "./columns"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Calendar, List, RefreshCw, Pencil, Check, X } from "lucide-react"
import { ReservationDialog } from "./reservation-dialog"
import { ReservationCalendar } from "./reservation-calendar"
import { updateReservationStatus, deleteReservation } from "@/actions/reservations"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Table, Zone } from "@prisma/client"

interface ReservationsClientProps {
  initialReservations: ReservationWithTable[]
  tables: (Table & { zone: Zone | null })[]
}

export function ReservationsClient({ initialReservations, tables }: ReservationsClientProps) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<ReservationWithTable | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleEdit = (reservation: ReservationWithTable) => {
    setEditingReservation(reservation)
    setIsDialogOpen(true)
  }

  const handleStatusChange = async (id: string, status: string) => {
    const result = await updateReservationStatus(id, status)
    if (result.success) {
      toast.success("Estado actualizado")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta reservación?")) return

    const result = await deleteReservation(id)
    if (result.success) {
      toast.success("Reservación eliminada")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingReservation(null)
  }

  const handleSuccess = () => {
    handleDialogClose()
    router.refresh()
  }

  const handleCreateNew = (_date: Date, _tableId?: string) => {
    setEditingReservation(null)
    setIsDialogOpen(true)
  }

  // Create columns with handlers
  const columnsWithHandlers = columns.map(col => {
    if (col.id === "actions") {
      return {
        ...col,
        cell: ({ row }: { row: { original: ReservationWithTable } }) => {
          const reservation = row.original

          return (
            <TooltipProvider delayDuration={100}>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(reservation)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar</TooltipContent>
                </Tooltip>
                {reservation.status === "PENDING" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleStatusChange(reservation.id, "CONFIRMED")}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Confirmar</TooltipContent>
                  </Tooltip>
                )}
                {(reservation.status === "PENDING" || reservation.status === "CONFIRMED") && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleStatusChange(reservation.id, "CANCELLED")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Cancelar</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          )
        }
      }
    }
    return col
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="list" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendario
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reservación
              </Button>
            </div>
          </div>

          <TabsContent value="list" className="m-0">
            <DataTable
              columns={columnsWithHandlers as any}
              data={initialReservations}
              searchKey="customerName"
              searchPlaceholder="Buscar por cliente..."
            />
          </TabsContent>

          <TabsContent value="calendar" className="m-0">
            <ReservationCalendar
              reservations={initialReservations}
              tables={tables}
              onEdit={handleEdit}
              onCreateNew={handleCreateNew}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ReservationDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        reservation={editingReservation}
        tables={tables}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

