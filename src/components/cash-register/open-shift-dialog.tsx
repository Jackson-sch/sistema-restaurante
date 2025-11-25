"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { openShiftSchema, type OpenShiftInput } from "@/lib/schemas/cash-register"
import { openShift } from "@/actions/cash-register"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

export function OpenShiftDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<OpenShiftInput>({
        resolver: zodResolver(openShiftSchema),
        defaultValues: {
            openingCash: 0,
            turn: "MAÑANA",
            notes: "",
        },
    })

    const onSubmit = (data: OpenShiftInput) => {
        startTransition(async () => {
            const result = await openShift(data)
            if (result.success) {
                toast.success("Caja abierta correctamente")
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
                <Button size="lg" className="w-full sm:w-auto">Abrir Caja</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Apertura de Caja</DialogTitle>
                    <DialogDescription>
                        Ingresa el monto inicial para comenzar el turno.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="openingCash">Monto Inicial (S/)</Label>
                        <Input
                            id="openingCash"
                            type="number"
                            step="0.01"
                            min="0"
                            {...register("openingCash", { valueAsNumber: true })}
                        />
                        {errors.openingCash && (
                            <p className="text-sm text-red-500">{errors.openingCash.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="turn">Turno</Label>
                        <Select
                            onValueChange={(value) => setValue("turn", value)}
                            defaultValue="MAÑANA"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un turno" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MAÑANA">Mañana</SelectItem>
                                <SelectItem value="TARDE">Tarde</SelectItem>
                                <SelectItem value="NOCHE">Noche</SelectItem>
                                <SelectItem value="EXTRA">Extra</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.turn && (
                            <p className="text-sm text-red-500">{errors.turn.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas (Opcional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Observaciones iniciales..."
                            {...register("notes")}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Abriendo..." : "Abrir Turno"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
