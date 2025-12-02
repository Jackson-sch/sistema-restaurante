"use client"

import * as React from "react"
import { CalendarIcon, X, ChevronRight } from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface DatePickerWithRangeProps {
  className?: string
  date?: DateRange
  setDate: (date: DateRange | undefined) => void
  placeholder?: string
  showPresets?: boolean
  align?: "start" | "center" | "end"
}

const presets = [
  {
    label: "Hoy",
    getValue: () => {
      const today = new Date()
      return { from: today, to: today }
    },
  },
  {
    label: "Ayer",
    getValue: () => {
      const yesterday = subDays(new Date(), 1)
      return { from: yesterday, to: yesterday }
    },
  },
  {
    label: "Últimos 7 días",
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: "Últimos 30 días",
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    label: "Esta semana",
    getValue: () => ({
      from: startOfWeek(new Date(), { locale: es }),
      to: endOfWeek(new Date(), { locale: es }),
    }),
  },
  {
    label: "Este mes",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "Mes pasado",
    getValue: () => {
      const lastMonth = subDays(startOfMonth(new Date()), 1)
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      }
    },
  },
]

export function DatePickerWithRange({
  className,
  date,
  setDate,
  placeholder = "Seleccionar fechas",
  showPresets = true,
  align = "start",
  ...props
}: DatePickerWithRangeProps & React.ComponentProps<typeof Calendar>) {
  const [open, setOpen] = React.useState(false)
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date)

  // Sync tempDate with date prop when popover opens
  React.useEffect(() => {
    if (open) {
      setTempDate(date)
    }
  }, [open, date])

  const handlePresetClick = (preset: (typeof presets)[0]) => {
    const newDate = preset.getValue()
    setTempDate(newDate)
  }

  const handleApply = () => {
    setDate(tempDate)
    setOpen(false)
  }

  const handleClear = () => {
    setTempDate(undefined)
    setDate(undefined)
  }

  const handleCancel = () => {
    setTempDate(date)
    setOpen(false)
  }

  const daysDiff = React.useMemo(() => {
    if (date?.from && date?.to) {
      return differenceInDays(date.to, date.from) + 1
    }
    return null
  }, [date])

  const formatDateRange = () => {
    if (!date?.from) return null

    const fromFormatted = format(date.from, "d MMM yyyy", { locale: es })

    if (!date.to || date.from.getTime() === date.to.getTime()) {
      return fromFormatted
    }

    const toFormatted = format(date.to, "d MMM yyyy", { locale: es })
    return (
      <span className="flex items-center gap-1">
        {fromFormatted}
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        {toFormatted}
      </span>
    )
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full sm:w-auto justify-start text-left font-normal group",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{date?.from ? formatDateRange() : placeholder}</span>
            {daysDiff && (
              <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {daysDiff} {daysDiff === 1 ? "día" : "días"}
              </span>
            )}
            {date?.from && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation()
                    handleClear()
                  }
                }}
                className="ml-1 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted p-0.5 transition-opacity"
                aria-label="Limpiar fechas"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[700px] p-0" align={align}>
          <div className="flex flex-col sm:flex-row">
            {/* Presets sidebar */}
            {showPresets && (
              <>
                <div className="p-3 space-y-1 sm:border-r border-b sm:border-b-0">
                  <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Rangos rápidos</p>
                  {presets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-sm font-normal h-8"
                      onClick={() => handlePresetClick(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempDate?.from || new Date()}
                selected={tempDate as any}
                onSelect={setTempDate as any}
                numberOfMonths={2}
                locale={es}
                className="hidden sm:block"
                {...props}
              />
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempDate?.from || new Date()}
                selected={tempDate as any}
                onSelect={setTempDate as any}
                numberOfMonths={1}
                locale={es}
                className="sm:hidden"
                {...props}
              />

              {/* Footer with actions */}
              <Separator className="my-3" />
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {tempDate?.from && tempDate?.to ? (
                    <>{differenceInDays(tempDate.to, tempDate.from) + 1} días seleccionados</>
                  ) : tempDate?.from ? (
                    "Selecciona fecha final"
                  ) : (
                    "Selecciona fecha inicial"
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleApply} disabled={!tempDate?.from}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
