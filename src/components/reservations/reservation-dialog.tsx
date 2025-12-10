"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Users, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createReservation, updateReservation, checkTableAvailability } from "@/actions/reservations"
import type { ReservationWithTable } from "./columns"
import type { Table, Zone } from "@prisma/client"

const reservationSchema = z.object({
  tableId: z.string().min(1, "Selecciona una mesa"),
  date: z.date(),
  time: z.string().min(1, "Selecciona una hora"),
  duration: z.number().min(30).max(480),
  guests: z.number().min(1).max(50),
  customerName: z.string().min(2, "Nombre requerido"),
  customerPhone: z.string().min(6, "Teléfono requerido"),
  customerEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
})

type ReservationFormData = z.infer<typeof reservationSchema>

interface ReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservation?: ReservationWithTable | null
  tables: (Table & { zone: Zone | null })[]
  onSuccess: () => void
}

const timeSlots = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 10 // Start at 10:00
  const minutes = i % 2 === 0 ? "00" : "30"
  return `${hour.toString().padStart(2, "0")}:${minutes}`
}).filter(t => {
  const hour = parseInt(t.split(":")[0])
  return hour >= 10 && hour <= 23
})

const durations = [
  { value: 60, label: "1 hora" },
  { value: 90, label: "1.5 horas" },
  { value: 120, label: "2 horas" },
  { value: 150, label: "2.5 horas" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
]

export function ReservationDialog({
  open,
  onOpenChange,
  reservation,
  tables,
  onSuccess,
}: ReservationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null)

  const isEditing = !!reservation

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      duration: 120,
      guests: 2,
    },
  })

  const selectedTableId = watch("tableId")
  const selectedDate = watch("date")
  const selectedTime = watch("time")
  const selectedDuration = watch("duration")

  // Reset form when dialog opens/closes or reservation changes
  useEffect(() => {
    if (open) {
      if (reservation) {
        const reservationDate = new Date(reservation.date)
        reset({
          tableId: reservation.tableId,
          date: reservationDate,
          time: format(reservationDate, "HH:mm"),
          duration: reservation.duration,
          guests: reservation.guests,
          customerName: reservation.customerName,
          customerPhone: reservation.customerPhone,
          customerEmail: reservation.customerEmail || "",
          notes: reservation.notes || "",
        })
      } else {
        reset({
          tableId: "",
          date: undefined,
          time: "",
          duration: 120,
          guests: 2,
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          notes: "",
        })
      }
    }
  }, [open, reservation, reset])

  // Check availability when table/date/time/duration changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedTableId || !selectedDate || !selectedTime) {
        setAvailabilityMessage(null)
        return
      }

      const [hours, minutes] = selectedTime.split(":").map(Number)
      const dateTime = new Date(selectedDate)
      dateTime.setHours(hours, minutes, 0, 0)

      const result = await checkTableAvailability(
        selectedTableId,
        dateTime,
        selectedDuration || 120,
        reservation?.id
      )

      if (result.available) {
        setAvailabilityMessage(null)
      } else {
        setAvailabilityMessage("⚠️ Esta mesa no está disponible en ese horario")
      }
    }

    checkAvailability()
  }, [selectedTableId, selectedDate, selectedTime, selectedDuration, reservation?.id])

  const onSubmit = async (data: ReservationFormData) => {
    setIsSubmitting(true)

    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(":").map(Number)
      const dateTime = new Date(data.date)
      dateTime.setHours(hours, minutes, 0, 0)

      if (isEditing && reservation) {
        const result = await updateReservation(reservation.id, {
          tableId: data.tableId,
          date: dateTime,
          duration: data.duration,
          guests: data.guests,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || undefined,
          notes: data.notes,
        })

        if (result.success) {
          toast.success("Reservación actualizada")
          onSuccess()
        } else {
          toast.error(result.error)
        }
      } else {
        const result = await createReservation({
          tableId: data.tableId,
          date: dateTime,
          duration: data.duration,
          guests: data.guests,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || undefined,
          notes: data.notes,
        })

        if (result.success) {
          toast.success("Reservación creada")
          onSuccess()
        } else {
          toast.error(result.error)
        }
      }
    } catch (error) {
      toast.error("Error al guardar la reservación")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group tables by zone
  const tablesByZone = tables.reduce((acc, table) => {
    const zoneName = table.zone?.name || "Sin zona"
    if (!acc[zoneName]) acc[zoneName] = []
    acc[zoneName].push(table)
    return acc
  }, {} as Record<string, typeof tables>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Reservación" : "Nueva Reservación"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Editando reservación ${reservation?.reservationNumber}`
              : "Completa los datos para crear una nueva reservación"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Table Selection */}
          <div className="space-y-2">
            <Label>Mesa *</Label>
            <Select
              value={selectedTableId}
              onValueChange={(value) => setValue("tableId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar mesa" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tablesByZone).map(([zoneName, zoneTables]) => (
                  <div key={zoneName}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {zoneName}
                    </div>
                    {zoneTables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        Mesa {table.number} ({table.capacity} personas)
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {errors.tableId && (
              <p className="text-sm text-destructive">{errors.tableId.message}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "d MMM yyyy", { locale: es })
                    ) : (
                      "Seleccionar"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setValue("date", date)}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Hora *</Label>
              <Select
                value={selectedTime}
                onValueChange={(value) => setValue("time", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.time && (
                <p className="text-sm text-destructive">{errors.time.message}</p>
              )}
            </div>
          </div>

          {/* Availability message */}
          {availabilityMessage && (
            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
              {availabilityMessage}
            </p>
          )}

          {/* Duration and Guests */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Duración
              </Label>
              <Select
                value={selectedDuration?.toString()}
                onValueChange={(value) => setValue("duration", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Personas *
              </Label>
              <Input
                type="number"
                min={1}
                max={50}
                {...register("guests", { valueAsNumber: true })}
              />
              {errors.guests && (
                <p className="text-sm text-destructive">{errors.guests.message}</p>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-2">
            <Label>Nombre del cliente *</Label>
            <Input
              placeholder="Juan Pérez"
              {...register("customerName")}
            />
            {errors.customerName && (
              <p className="text-sm text-destructive">{errors.customerName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input
                placeholder="987654321"
                {...register("customerPhone")}
              />
              {errors.customerPhone && (
                <p className="text-sm text-destructive">{errors.customerPhone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email (opcional)</Label>
              <Input
                type="email"
                placeholder="email@ejemplo.com"
                {...register("customerEmail")}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Cumpleaños, alergias, preferencias..."
              rows={2}
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !!availabilityMessage}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Reservación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
