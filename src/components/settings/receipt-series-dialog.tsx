"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { receiptSeriesSchema, type ReceiptSeriesInput } from "@/lib/schemas/receipt-series"
import { createReceiptSeries } from "@/actions/receipt-series"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

export function ReceiptSeriesDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<ReceiptSeriesInput>({
        resolver: zodResolver(receiptSeriesSchema) as any,
        defaultValues: {
            type: "BOLETA",
            series: "",
            currentNumber: 1,
            active: true,
        },
    })

    const onSubmit = (data: ReceiptSeriesInput) => {
        startTransition(async () => {
            const result = await createReceiptSeries(data)
            if (result.success) {
                toast.success("Serie creada correctamente")
                setOpen(false)
                reset()
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Serie
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nueva Serie de Comprobante</DialogTitle>
                    <DialogDescription>
                        Configura una nueva serie para la emisión de comprobantes.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Comprobante</Label>
                        <Select
                            onValueChange={(val) => setValue("type", val as any)}
                            defaultValue="BOLETA"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BOLETA">Boleta</SelectItem>
                                <SelectItem value="FACTURA">Factura</SelectItem>
                                <SelectItem value="NOTA_VENTA">Nota de Venta</SelectItem>
                                <SelectItem value="TICKET">Ticket</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && (
                            <p className="text-sm text-red-500">{errors.type.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="series">Serie (ej. B001)</Label>
                            <Input
                                id="series"
                                {...register("series")}
                                placeholder="B001"
                                maxLength={4}
                                className="uppercase"
                                onChange={(e) => {
                                    e.target.value = e.target.value.toUpperCase()
                                    register("series").onChange(e)
                                }}
                            />
                            {errors.series && (
                                <p className="text-sm text-red-500">{errors.series.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currentNumber">Correlativo Inicial</Label>
                            <Input
                                id="currentNumber"
                                type="number"
                                min="1"
                                {...register("currentNumber", { valueAsNumber: true })}
                            />
                            {errors.currentNumber && (
                                <p className="text-sm text-red-500">{errors.currentNumber.message}</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar Serie"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
