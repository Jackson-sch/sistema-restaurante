"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteReceiptSeries } from "@/actions/receipt-series"
import { toast } from "sonner"
import { ReceiptSeriesDialog } from "./receipt-series-dialog"

interface ReceiptSeriesListProps {
    series: any[]
}

export function ReceiptSeriesList({ series }: ReceiptSeriesListProps) {
    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar esta serie?")) return

        const result = await deleteReceiptSeries(id)
        if (result.success) {
            toast.success("Serie eliminada")
        } else {
            toast.error(result.error)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Series de Comprobantes</CardTitle>
                    <CardDescription>
                        Administra las series y numeración de tus comprobantes.
                    </CardDescription>
                </div>
                <ReceiptSeriesDialog />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {series.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No hay series configuradas.
                        </p>
                    ) : (
                        <div className="grid gap-4">
                            {series.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{item.type}</span>
                                            <Badge variant="outline">{item.series}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Siguiente número: <span className="font-mono font-medium">{item.currentNumber}</span>
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
