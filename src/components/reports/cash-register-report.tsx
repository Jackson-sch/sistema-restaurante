"use client"

import { useState, useEffect, useTransition } from "react"
import type { DateRange } from "react-day-picker"
import { subDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { getCashRegisterReport } from "@/actions/reports"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, Calculator, Store } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function CashRegisterReport() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [data, setData] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const fetchData = () => {
    if (!date?.from) return

    startTransition(async () => {
      const result = await getCashRegisterReport(date.from, date.to)
      if (result.success) {
        setData(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  useEffect(() => {
    fetchData()
  }, [date])

  if (!data && isPending) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reporte de Caja</h2>
          <p className="text-muted-foreground">Historial de aperturas, cierres y cuadres de caja.</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange date={date} setDate={setDate} />
          <Button onClick={fetchData} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesiones de Caja</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Aperturas en el periodo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descuadre Total</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.summary.totalDiscrepancy !== 0 ? "text-red-500" : "text-green-500"}`}>
              S/ {data.summary.totalDiscrepancy.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Suma de diferencias (Sobran/Faltan)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cajas con Descuadre</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${data.summary.discrepancyCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.summary.discrepancyCount > 0 ? "text-red-500" : ""}`}>
              {data.summary.discrepancyCount}
            </div>
            <p className="text-xs text-muted-foreground">Sesiones con diferencias</p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Sesiones</CardTitle>
          <CardDescription>Detalle de cada apertura y cierre de caja.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha Apertura</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Apertura</TableHead>
                <TableHead className="text-right">Cierre (Esperado)</TableHead>
                <TableHead className="text-right">Cierre (Real)</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No se encontraron registros en este periodo.
                  </TableCell>
                </TableRow>
              ) : (
                data.sessions.map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {format(new Date(session.openedAt), "dd MMM yyyy HH:mm", { locale: es })}
                    </TableCell>
                    <TableCell>{session.user}</TableCell>
                    <TableCell>
                      <Badge variant={session.status === "Cerrada" ? "secondary" : "default"}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      S/ {session.openingCash.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {session.expectedCash ? `S/ ${session.expectedCash.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {session.closingCash ? `S/ ${session.closingCash.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className={`text-right font-bold ${session.difference < 0 ? "text-red-500" :
                        session.difference > 0 ? "text-blue-500" : "text-green-500"
                      }`}>
                      {session.difference ? `S/ ${session.difference.toFixed(2)}` : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
