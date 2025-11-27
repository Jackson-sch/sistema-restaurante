"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { useQueryState, parseAsIsoDateTime } from "nuqs"

const presets = [
  { label: "Hoy", days: 0 },
  { label: "Ayer", days: 1 },
  { label: "Últimos 7 días", days: 6 },
  { label: "Últimos 30 días", days: 29 },
  { label: "Últimos 90 días", days: 89 },
]

export function DateRangeFilter() {
  const [from, setFrom] = useQueryState(
    "from",
    parseAsIsoDateTime.withDefault(startOfDay(new Date()))
  )
  const [to, setTo] = useQueryState(
    "to",
    parseAsIsoDateTime.withDefault(endOfDay(new Date()))
  )

  const dateRange: DateRange = {
    from: from,
    to: to,
  }

  const handlePresetClick = (days: number) => {
    const today = new Date()
    const fromDate = days === 0 ? startOfDay(today) : startOfDay(subDays(today, days))
    const toDate = endOfDay(today)

    setFrom(fromDate)
    setTo(toDate)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setFrom(startOfDay(range.from))
    }
    if (range?.to) {
      setTo(endOfDay(range.to))
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex gap-2 flex-wrap">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset.days)}
            className={cn(
              "text-xs",
              // light styles
              "bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
              // dark styles
              "dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]",
              preset.days === 0 &&
              from.toDateString() === startOfDay(new Date()).toDateString() &&
              "bg-primary"
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM", { locale: es })} -{" "}
                  {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd MMM yyyy", { locale: es })
              )
            ) : (
              <span>Seleccionar fecha</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeChange}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
