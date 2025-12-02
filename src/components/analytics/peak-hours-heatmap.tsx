"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
// Importar los componentes de Tooltip de Shadcn UI
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PeakHoursHeatmapProps {
  data: number[][] // 7 days x 24 hours
}

export function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const maxValue = Math.max(...data.flat())

  const getIntensityClass = (value: number) => {
    if (maxValue === 0) return "bg-gray-200 dark:bg-gray-700/50"
    if (value === 0) return "bg-gray-100 dark:bg-gray-900/50"

    const percentage = value / maxValue

    // Gradiente de 5 pasos (Indigo)
    if (percentage < 0.2) return "bg-indigo-300/30 dark:bg-indigo-700/30"
    if (percentage < 0.4) return "bg-indigo-300/60 dark:bg-indigo-700/60"
    if (percentage < 0.6) return "bg-indigo-400/80 dark:bg-indigo-600/80"
    if (percentage < 0.8) return "bg-indigo-500 dark:bg-indigo-500"
    return "bg-indigo-600 dark:bg-indigo-400"
  }

  const formatTime = (hour: number) => `${hour.toString().padStart(2, '0')}:00`

  return (
    // ENVUELVE TODO EL COMPONENTE EN TooltipProvider
    <TooltipProvider delayDuration={150}>
      <Card className="col-span-4 lg:col-span-2 h-full flex flex-col">
        <CardHeader>
          <CardTitle>Mapa de Calor: Horas Pico</CardTitle>
          <CardDescription>
            Intensidad de órdenes por día y hora (Máximo: {maxValue} órdenes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* El overflow-x-auto que causa el recorte del CSS Tooltip */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px] select-none">

              {/* Etiquetas de las horas (omitas por brevedad) */}
              <div className="flex">
                <div className="w-10 shrink-0"></div>
                <div className="flex-1 grid grid-cols-24 gap-0.5 mb-2">
                  {hours.map(h => (
                    <div key={h} className="text-[10px] text-center text-muted-foreground/80 font-medium">
                      {h % 6 === 0 ? h : (h % 3 === 0 ? '•' : '')}
                    </div>
                  ))}
                </div>
              </div>

              {/* Filas del Heatmap */}
              <div className="space-y-1">
                {days.map((day, dayIndex) => (
                  <div key={day} className="flex items-center gap-1.5">
                    {/* Etiqueta del Día (omitas por brevedad) */}
                    <div className="w-8 shrink-0 text-xs font-semibold text-muted-foreground/80 text-right">
                      {day}
                    </div>
                    {/* Celdas del Heatmap */}
                    <div className="flex-1 grid grid-cols-24 gap-0.5 h-7">
                      {data[dayIndex].map((value, hourIndex) => {
                        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                        return (
                          // IMPLEMENTACIÓN DEL TOOLTIP DE SHADCN/RADIX
                          <Tooltip key={hourIndex}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "rounded-[2px] transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-help",
                                  getIntensityClass(value)
                                )}
                              // El Trigger es la celda
                              />
                            </TooltipTrigger>
                            <TooltipContent
                              side="top" // Posición del Tooltip
                              className="px-3 py-1.5 text-center min-w-[120px] shadow-lg"
                            >
                              <p className="font-bold text-sm">{day} | {formatTime(hourIndex)}</p>
                              <p className="text-muted-foreground mt-0.5">
                                **{value} órdenes**
                              </p>
                              {percentage > 0 && (
                                <p className="text-[10px] opacity-80">
                                  ({percentage.toFixed(0)}% del Máx.)
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Leyenda del Heatmap (omitas por brevedad) */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="font-medium">Intensidad de Órdenes (0 a {maxValue})</span>
                <div className="flex items-center gap-1">
                  <span className="mr-1">Baja</span>
                  <div className="w-4 h-4 rounded-[2px] bg-gray-100 dark:bg-gray-900/50" />
                  <div className="w-4 h-4 rounded-[2px] bg-indigo-300/30 dark:bg-indigo-700/30" />
                  <div className="w-4 h-4 rounded-[2px] bg-indigo-300/60 dark:bg-indigo-700/60" />
                  <div className="w-4 h-4 rounded-[2px] bg-indigo-400/80 dark:bg-indigo-600/80" />
                  <div className="w-4 h-4 rounded-[2px] bg-indigo-500 dark:bg-indigo-500" />
                  <div className="w-4 h-4 rounded-[2px] bg-indigo-600 dark:bg-indigo-400" />
                  <span className="ml-1">Alta</span>
                </div>
              </div>

            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}