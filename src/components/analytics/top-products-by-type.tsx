"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { ScrollArea } from "../ui/scroll-area"

interface TopProductsByTypeProps {
  data: Array<{
    type: string
    topProducts: Array<{
      name: string
      quantity: number
      revenue: number
    }>
  }>
}

const TYPE_LABELS = {
  DINE_IN: "Comedor",
  TAKEOUT: "Para Llevar",
  DELIVERY: "Delivery"
}

export function TopProductsByType({ data }: TopProductsByTypeProps) {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Productos Más Vendidos</CardTitle>
        <CardDescription>Top 10 por tipo de orden</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="DINE_IN" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {data.map((typeData) => (
              <TabsTrigger key={typeData.type} value={typeData.type}>
                {TYPE_LABELS[typeData.type as keyof typeof TYPE_LABELS]}
              </TabsTrigger>
            ))}
          </TabsList>
          {data.map((typeData) => (
            <TabsContent key={typeData.type} value={typeData.type}>
              <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeData.topProducts.length > 0 ? (
                      typeData.topProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell className="text-right">{product.quantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(product.revenue)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No hay datos disponibles
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
