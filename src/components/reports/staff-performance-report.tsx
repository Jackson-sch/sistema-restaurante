"use client"

import { useState, useEffect, useTransition } from "react"
import type { DateRange } from "react-day-picker"
import { subDays } from "date-fns"
import { getStaffPerformanceReport } from "@/actions/reports"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, User, CreditCard } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { toast } from "sonner"

const staffChartConfig = {
  totalSales: {
    label: "Ventas",
    color: "var(--chart-1)",
  },
  totalCollected: {
    label: "Recaudado",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function StaffPerformanceReport() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })
  const [data, setData] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [isVisible, setIsVisible] = useState(false)

  const fetchData = () => {
    if (!date?.from) return

    startTransition(async () => {
      const result = await getStaffPerformanceReport(date.from, date.to)
      if (result.success) {
        setData(result.data)
        setIsVisible(false)
        setTimeout(() => setIsVisible(true), 50)
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
          <h2 className="text-2xl font-bold tracking-tight">Rendimiento del Personal</h2>
          <p className="text-muted-foreground">Desempeño de meseros y cajeros.</p>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithRange date={date} setDate={setDate} />
          <Button onClick={fetchData} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Waiters Chart */}
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meseros: Ventas Generadas
            </CardTitle>
            <CardDescription>Total vendido por cada mesero (órdenes completadas).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={staffChartConfig} className="min-h-[350px] w-full">
              <BarChart
                accessibilityLayer
                data={data.waiters}
                layout="vertical"
                margin={{ left: 0 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/50" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  width={100}
                  className="text-xs"
                />
                <XAxis dataKey="totalSales" type="number" hide />
                <ChartTooltip
                  cursor={{ fill: "var(--primary)", opacity: 0.08 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="totalSales"
                  layout="vertical"
                  fill="var(--chart-1)"
                  radius={[0, 8, 8, 0]}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                  isAnimationActive={isVisible}
                >
                  <LabelList
                    dataKey="totalSales"
                    position="right"
                    offset={8}
                    className="fill-foreground font-semibold"
                    fontSize={12}
                    formatter={(value: number) => `S/ ${value.toFixed(0)}`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Cashiers Chart */}
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Cajeros: Pagos Procesados
            </CardTitle>
            <CardDescription>Total recaudado por cada cajero.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={staffChartConfig} className="min-h-[350px] w-full">
              <BarChart
                accessibilityLayer
                data={data.cashiers}
                layout="vertical"
                margin={{ left: 0 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted/50" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  width={100}
                  className="text-xs"
                />
                <XAxis dataKey="totalCollected" type="number" hide />
                <ChartTooltip
                  cursor={{ fill: "var(--primary)", opacity: 0.08 }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="totalCollected"
                  layout="vertical"
                  fill="var(--chart-2)"
                  radius={[0, 8, 8, 0]}
                  animationBegin={100}
                  animationDuration={800}
                  animationEasing="ease-out"
                  isAnimationActive={isVisible}
                >
                  <LabelList
                    dataKey="totalCollected"
                    position="right"
                    offset={8}
                    className="fill-foreground font-semibold"
                    fontSize={12}
                    formatter={(value: number) => `S/ ${value.toFixed(0)}`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
