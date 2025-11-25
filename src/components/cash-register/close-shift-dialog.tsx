"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { closeShiftSchema, type CloseShiftInput } from "@/lib/schemas/cash-register"
import { closeShift } from "@/actions/cash-register"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface CloseShiftDialogProps {
    cashRegisterId: string
    expectedCash: number
}

export function CloseShiftDialog({ cashRegisterId, expectedCash }: CloseShiftDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<CloseShiftInput>({
        resolver: zodResolver(closeShiftSchema),
        defaultValues: {
            closingCash: 0,
            notes: "",
        },
    })

    const closingCash = watch("closingCash")
    const difference = closingCash - expectedCash

    const onSubmit = (data: CloseShiftInput) => {
        startTransition(async () => {
            const result = await closeShift(cashRegisterId, data)
            if (result.success) {
                toast.success("Caja cerrada correctamente")
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
                <Button variant="destructive">Cerrar Caja</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cierre de Caja</DialogTitle>
                    <DialogDescription>
                        Verifica el efectivo físico y confirma el cierre.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Esperado en Sistema:</span>
                        <span className="font-bold">{formatCurrency(expectedCash)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="closingCash">Efectivo Real (S/)</Label>
                        <Input
                            id="closingCash"
                            type="number"
                            step="0.01"
                            min="0"
                            {...register("closingCash", { valueAsNumber: true })}
                        />
                        {errors.closingCash && (
                            <p className="text-sm text-red-500">{errors.closingCash.message}</p>
                        )}
                    </div>

                    <div className={`text-sm flex justify-between p-2 rounded ${difference === 0 ? 'bg-green-100 text-green-800' :
                            difference > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                        <span>Diferencia:</span>
                        <span className="font-bold">{formatCurrency(difference)}</span>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas de Cierre</Label>
                        <Textarea
                            id="notes"
                            placeholder="Observaciones..."
                            {...register("notes")}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" variant="destructive" disabled={isPending}>
                            {isPending ? "Cerrando..." : "Confirmar Cierre"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
