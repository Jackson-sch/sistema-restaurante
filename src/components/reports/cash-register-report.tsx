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
import StatCard from "../stat-card"
import { formatCurrency } from "@/lib/utils"

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

  const stats = [{
    title: "Total de Sesiones",
    value: data.summary.totalSessions,
    icon: Store,
    iconColor: "text-primary",
    description: "Aperturas en el periodo",
  }, {
    title: "Total de Descuadres",
    value: formatCurrency(data.summary.totalDiscrepancy),
    icon: AlertTriangle,
    iconColor: "text-red-500",
    description: "Suma de diferencias (Sobran/Faltan)",
  }, {
    title: "Total de Sesiones con Descuadre",
    value: data.summary.discrepancyCount,
    icon: AlertTriangle,
    iconColor: "text-red-500",
    description: "Sesiones con diferencias",
  }]

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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
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
