"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { generateSalesExcel, generateInventoryExcel } from "@/actions/reports-export"
import { toast } from "sonner"
import { DateRange } from "react-day-picker"

interface ReportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportExportDialog({ open, onOpenChange }: ReportExportDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [reportType, setReportType] = useState<"sales" | "inventory">("sales")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })

  const handleExport = () => {
    if (reportType === "sales" && (!dateRange?.from || !dateRange?.to)) {
      toast.error("Por favor selecciona un rango de fechas")
      return
    }

    startTransition(async () => {
      try {
        let result

        if (reportType === "sales") {
          result = await generateSalesExcel(dateRange!.from!, dateRange!.to!)
        } else {
          result = await generateInventoryExcel()
        }

        if (result.success && result.data) {
          // Convert base64 to blob and download
          const byteCharacters = atob(result.data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })

          // Create download link
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = result.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          toast.success("Reporte generado exitosamente")
          onOpenChange(false)
        } else {
          toast.error(result.error || "Error al generar el reporte")
        }
      } catch (error) {
        console.error("Error exporting report:", error)
        toast.error("Error al generar el reporte")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Reporte</DialogTitle>
          <DialogDescription>
            Selecciona el tipo de reporte y el período para exportar
          </DialogDescription>
        </DialogHeader>

        <Tabs value={reportType} onValueChange={(v) => setReportType(v as "sales" | "inventory")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: es })
                      )
                    ) : (
                      <span>Selecciona un rango de fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-semibold text-sm">El reporte incluirá:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Resumen de ventas del período</li>
                <li>• Ventas diarias</li>
                <li>• Productos más vendidos</li>
                <li>• Ventas por categoría</li>
                <li>• Métodos de pago</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 mt-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-semibold text-sm">El reporte incluirá:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Inventario completo actual</li>
                <li>• Niveles de stock</li>
                <li>• Alertas de stock bajo</li>
                <li>• Valoración de inventario</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isPending} className="gap-2">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
