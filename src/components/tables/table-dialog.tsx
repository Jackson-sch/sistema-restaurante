"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { tableSchema, type TableInput } from "@/lib/schemas/tables"
import { createTable, updateTable } from "@/actions/tables"
import { toast } from "sonner"
import { type Table } from "@prisma/client"

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

import { getZones } from "@/actions/zones"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Zone } from "@prisma/client"

interface TableDialogProps {
    table?: Table & { zone?: Zone | null }
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onSuccess?: () => void
}

export function TableDialog({ table, trigger, open: controlledOpen, onOpenChange, onSuccess }: TableDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [zones, setZones] = useState<Zone[]>([])

    const isControlled = typeof controlledOpen !== "undefined"
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    useEffect(() => {
        const fetchZones = async () => {
            const result = await getZones()
            if (result.success && result.data) {
                setZones(result.data)
            }
        }
        fetchZones()
    }, [])

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        setValue,
        watch,
    } = useForm<TableInput>({
        resolver: zodResolver(tableSchema),
        defaultValues: {
            number: "",
            capacity: 4,
            status: "AVAILABLE",
        },
    })

    useEffect(() => {
        if (table) {
            setValue("number", table.number)
            setValue("capacity", table.capacity)
            setValue("status", table.status as "AVAILABLE" | "OCCUPIED" | "RESERVED")
            if (table.zoneId) {
                setValue("zoneId", table.zoneId)
            }
        } else {
            reset({
                number: "",
                capacity: 4,
                status: "AVAILABLE",
                zoneId: undefined,
            })
        }
    }, [table, setValue, reset, open])

    const onSubmit: SubmitHandler<TableInput> = (data) => {
        startTransition(async () => {
            if (table) {
                const result = await updateTable(table.id, data)
                if (result.success) {
                    toast.success("Mesa actualizada correctamente")
                    setOpen(false)
                    onSuccess?.()
                } else {
                    toast.error(result.error)
                }
            } else {
                const result = await createTable(data)
                if (result.success) {
                    toast.success("Mesa creada correctamente")
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
                    <Button>Nueva Mesa</Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{table ? "Editar Mesa" : "Crear Mesa"}</DialogTitle>
                    <DialogDescription>
                        {table ? "Modifica los datos de la mesa." : "Agrega una nueva mesa al restaurante."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="number">Número de Mesa</Label>
                        <Input
                            id="number"
                            placeholder="Ej. 1, A1, Patio-1"
                            {...register("number")}
                        />
                        {errors.number && (
                            <p className="text-sm text-red-500">{errors.number.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="capacity">Capacidad (Personas)</Label>
                        <Input
                            id="capacity"
                            type="number"
                            min="1"
                            {...register("capacity", { valueAsNumber: true })}
                        />
                        {errors.capacity && (
                            <p className="text-sm text-red-500">{errors.capacity.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="zone">Zona</Label>
                        <Select
                            onValueChange={(value) => setValue("zoneId", value)}
                            defaultValue={table?.zoneId || undefined}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar zona" />
                            </SelectTrigger>
                            <SelectContent>
                                {zones.map((zone) => (
                                    <SelectItem key={zone.id} value={zone.id}>
                                        {zone.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
