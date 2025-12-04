"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { zoneSchema, type ZoneInput } from "@/lib/schemas/zones"
import { createZone, updateZone } from "@/actions/zones"
import { toast } from "sonner"
import { type Zone } from "@prisma/client"

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

interface ZoneDialogProps {
    zone?: Zone
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: () => void
}

export function ZoneDialog({ zone, trigger, open: controlledOpen, onOpenChange, onSuccess }: ZoneDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const isControlled = typeof controlledOpen !== "undefined"
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        setValue,
    } = useForm({
        resolver: zodResolver(zoneSchema),
        defaultValues: {
            name: "",
            order: 0,
        },
    })

    useEffect(() => {
        if (zone) {
            setValue("name", zone.name)
            setValue("order", zone.order)
        } else {
            reset({
                name: "",
                order: 0,
            })
        }
    }, [zone, setValue, reset, open])

    const onSubmit: SubmitHandler<ZoneInput> = (data) => {
        startTransition(async () => {
            if (zone) {
                const result = await updateZone(zone.id, data)
                if (result.success) {
                    toast.success("Zona actualizada correctamente")
                    setOpen(false)
                    onSuccess?.()
                } else {
                    toast.error(result.error)
                }
            } else {
                const result = await createZone(data)
                if (result.success) {
                    toast.success("Zona creada correctamente")
                    setOpen(false)
                    reset()
                    onSuccess?.()
                } else {
                    toast.error(result.error)
                }
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && !isControlled && (
                <DialogTrigger asChild>
                    <Button>Nueva Zona</Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{zone ? "Editar Zona" : "Crear Zona"}</DialogTitle>
                    <DialogDescription>
                        {zone ? "Modifica los datos de la zona." : "Agrega una nueva zona al restaurante."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la Zona</Label>
                        <Input
                            id="name"
                            placeholder="Ej. Terraza, Salón Principal"
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="order">Orden</Label>
                        <Input
                            id="order"
                            type="number"
                            {...register("order", { valueAsNumber: true })}
                        />
                        {errors.order && (
                            <p className="text-sm text-red-500">{errors.order.message}</p>
                        )}
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
