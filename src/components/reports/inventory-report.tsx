"use client"

import { useState, useEffect, useTransition } from "react"
import { getInventoryReport } from "@/actions/reports"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, AlertTriangle, DollarSign, ArrowRightLeft, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import StatCard from "@/components/stat-card"
import { formatCurrency, formatDate } from "@/lib/utils"

export function InventoryReport() {
  const [data, setData] = useState<any>(null)
  const [isPending, startTransition] = useTransition()

  const fetchData = () => {
    startTransition(async () => {
      const result = await getInventoryReport()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (!data && isPending) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return null

  /* Capturamos el Total de Ingredientes, Valor del Inventario y Alertas de Stock */
  const totalIngredients = data.summary?.totalIngredients
  const totalValue = formatCurrency(data.summary?.totalValue)
  const lowStockCount = data.summary?.lowStockCount

  const stats = [{
    title: "Total Ingredientes",
    value: totalIngredients,
    icon: Package,
    iconColor: "text-blue-500",
    description: "Registrados en el sistema"
  }, {
    title: "Valor del Inventario",
    value: totalValue,
    icon: DollarSign,
    iconColor: "text-green-500",
    description: "Costo total estimado"
  }, {
    title: "Alertas de Stock",
    value: lowStockCount,
    icon: AlertTriangle,
    iconColor: lowStockCount > 0 ? "text-red-500" : "text-muted-foreground",
    description: "Ingredientes con stock bajo"
  }]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reporte de Inventario</h2>
          <p className="text-muted-foreground">Estado actual del stock y movimientos recientes.</p>
        </div>
        <Button onClick={fetchData} disabled={isPending} size="sm" className="gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            {...stat}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Stock Bajo
            </CardTitle>
            <CardDescription>Ingredientes que requieren reabastecimiento.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.lowStockIngredients.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                
                No hay alertas de stock bajo.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="text-right">Stock Actual</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStockIngredients.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right text-red-600 font-bold">
                        {item.currentStock} {item.unit}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.minStock} {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Movimientos Recientes
            </CardTitle>
            <CardDescription>Últimos 20 movimientos de inventario.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentMovements.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No hay movimientos registrados.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentMovements.map((move: any) => (
                    <TableRow key={move.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(move.createdAt, "dd/MM HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{move.ingredientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 
                                                    ${move.type === 'IN' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' :
                            move.type === 'OUT' ? 'bg-blue-500/10 text-blue-600 border-blue-200' :
                              move.type === 'WASTE' ? 'bg-red-500/10 text-red-600 border-red-200' :
                                'bg-yellow-500/10 text-yellow-600 border-yellow-200'
                          }`}>
                          {move.type === 'IN' ? 'ENTRADA' :
                            move.type === 'OUT' ? 'SALIDA' :
                              move.type === 'WASTE' ? 'MERMA' : 'AJUSTE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {move.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
