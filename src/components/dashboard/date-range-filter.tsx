"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { CalendarIcon, CalendarDays, CalendarMinus, CalendarRange, Clock } from "lucide-react"
import { format, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { LucideIcon } from "lucide-react"

const presets: { label: string; days: number; icon: LucideIcon }[] = [
  { label: "Hoy", days: 0, icon: Clock },
  { label: "Ayer", days: 1, icon: CalendarMinus },
  { label: "7 días", days: 6, icon: CalendarDays },
  { label: "30 días", days: 29, icon: CalendarRange },
  { label: "90 días", days: 89, icon: CalendarIcon },
]

export function DateRangeFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get current dates from URL params
  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const from = fromParam ? new Date(fromParam) : null
  const to = toParam ? new Date(toParam) : null

  // Use current date as fallback for display
  const dateRange: DateRange = {
    from: from || startOfDay(new Date()),
    to: to || endOfDay(new Date()),
  }

  const updateUrl = useCallback((fromDate: Date, toDate: Date) => {
    // Format dates as local ISO strings (not UTC)
    const formatLocalISO = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      const ms = String(date.getMilliseconds()).padStart(3, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`
    }

    const params = new URLSearchParams()
    params.set("from", formatLocalISO(fromDate))
    params.set("to", formatLocalISO(toDate))
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname])

  const handlePresetClick = (days: number) => {
    const today = new Date()

    // Create start of day in local timezone
    const fromDate = new Date(today)
    if (days > 0) {
      fromDate.setDate(fromDate.getDate() - days)
    }
    fromDate.setHours(0, 0, 0, 0)

    // Create end of day in local timezone
    const toDate = new Date(today)
    toDate.setHours(23, 59, 59, 999)

    updateUrl(fromDate, toDate)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      // Create dates in local timezone
      const fromDate = new Date(range.from)
      fromDate.setHours(0, 0, 0, 0)

      const toDate = new Date(range.to)
      toDate.setHours(23, 59, 59, 999)

      updateUrl(fromDate, toDate)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex gap-1 md:gap-2 flex-wrap">
        {presets.map((preset) => {
          const Icon = preset.icon
          return (
            <Tooltip key={preset.label}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset.days)}
                  className={cn(
                    "text-xs px-2 md:px-3",
                    // light styles
                    "bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
                    // dark styles
                    "dark:bg-background transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]",
                    preset.days === 0 &&
                    from?.toDateString() === startOfDay(new Date()).toDateString() &&
                    "bg-primary"
                  )}
                >
                  <Icon className="h-4 w-4 md:mr-1.5" />
                  <span className="hidden md:inline">{preset.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">
                <p>{preset.label}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
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
