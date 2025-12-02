"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { transactionSchema, type TransactionInput } from "@/lib/schemas/cash-register"
import { addTransaction } from "@/actions/cash-register"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface TransactionDialogProps {
    cashRegisterId: string
    trigger?: React.ReactNode
}

export function TransactionDialog({ cashRegisterId, trigger }: TransactionDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<TransactionInput>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            amount: 0,
            type: "EXPENSE",
            concept: "",
            reference: "",
        },
    })

    const onSubmit = (data: TransactionInput) => {
        startTransition(async () => {
            const result = await addTransaction(cashRegisterId, data)
            if (result.success) {
                toast.success("Movimiento registrado")
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
                {trigger || <Button variant="outline">Registrar Movimiento</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Movimiento</DialogTitle>
                    <DialogDescription>
                        Registra ingresos o egresos de efectivo.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select onValueChange={(val) => setValue("type", val as any)} defaultValue="EXPENSE">
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INCOME">Ingreso</SelectItem>
                                <SelectItem value="EXPENSE">Gasto</SelectItem>
                                <SelectItem value="WITHDRAWAL">Retiro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto (S/)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            {...register("amount", { valueAsNumber: true })}
                        />
                        {errors.amount && (
                            <p className="text-sm text-red-500">{errors.amount.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="concept">Concepto</Label>
                        <Input
                            id="concept"
                            placeholder="Ej. Pago proveedores, Cambio..."
                            {...register("concept")}
                        />
                        {errors.concept && (
                            <p className="text-sm text-red-500">{errors.concept.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Referencia (Opcional)</Label>
                        <Input
                            id="reference"
                            placeholder="Nro. Recibo, Factura..."
                            {...register("reference")}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
