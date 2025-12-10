"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    closeShiftSchema,
    type CloseShiftInput,
    type DenominationInput,
    calculateTotalFromDenominations
} from "@/lib/schemas/cash-register"
import { closeShift } from "@/actions/cash-register"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { formatCurrency } from "@/lib/utils"
import { DenominationCounter } from "./denomination-counter"
import { ReconciliationSummary } from "./reconciliation-summary"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Calculator, ClipboardCheck, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShiftSummary {
    currentCash: number
    totalSales: number
    cashSales: number
    cardSales: number
    totalIncome: number
    totalExpenses: number
    initialCash: number
}

interface CloseShiftDialogProps {
    cashRegisterId: string
    expectedCash: number
    summary: ShiftSummary
    tolerance?: number
}

const defaultDenominations: DenominationInput = {
    s200: 0, s100: 0, s50: 0, s20: 0, s10: 0,
    c5: 0, c2: 0, c1: 0, c050: 0, c020: 0, c010: 0
}

export function CloseShiftDialog({ cashRegisterId, expectedCash, summary, tolerance = 5 }: CloseShiftDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [step, setStep] = useState<"count" | "confirm">("count")
    const [useDenominations, setUseDenominations] = useState(false)
    const [denominations, setDenominations] = useState<DenominationInput>(defaultDenominations)

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm<CloseShiftInput>({
        resolver: zodResolver(closeShiftSchema),
        defaultValues: {
            closingCash: 0,
            useDenominations: false,
            notes: "",
        },
    })

    const closingCash = watch("closingCash")
    const difference = closingCash - expectedCash

    // Sync denomination total with closingCash
    const handleDenominationChange = (newDenominations: DenominationInput) => {
        setDenominations(newDenominations)
        const total = calculateTotalFromDenominations(newDenominations)
        setValue("closingCash", total)
    }

    const onSubmit = (data: CloseShiftInput) => {
        startTransition(async () => {
            const submitData: CloseShiftInput = {
                ...data,
                useDenominations,
                denominations: useDenominations ? denominations : undefined,
            }

            const result = await closeShift(cashRegisterId, submitData)
            if (result.success) {
                toast.success("Caja cerrada correctamente")
                setOpen(false)
                resetDialog()
            } else {
                toast.error(result.error)
            }
        })
    }

    const resetDialog = () => {
        reset()
        setStep("count")
        setUseDenominations(false)
        setDenominations(defaultDenominations)
    }

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen)
        if (!isOpen) {
            resetDialog()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="destructive">Cerrar Caja</Button>
            </DialogTrigger>
            <DialogContent className={cn(
                "transition-all duration-300",
                step === "count" && useDenominations ? "sm:max-w-[600px]" : "sm:max-w-[500px]"
            )}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === "count" ? (
                            <>
                                <Calculator className="h-5 w-5" />
                                Arqueo de Caja
                            </>
                        ) : (
                            <>
                                <ClipboardCheck className="h-5 w-5" />
                                Confirmar Cierre
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "count"
                            ? "Cuenta el efectivo físico en caja y registra el monto."
                            : "Revisa el resumen y confirma el cierre del turno."
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {step === "count" && (
                        <>
                            {/* Toggle para conteo por denominaciones */}
                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="use-denominations" className="text-sm font-medium">
                                        Contar por denominaciones
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Cuenta billetes y monedas individualmente
                                    </p>
                                </div>
                                <Switch
                                    id="use-denominations"
                                    checked={useDenominations}
                                    onCheckedChange={(checked) => {
                                        setUseDenominations(checked)
                                        if (!checked) {
                                            setDenominations(defaultDenominations)
                                        }
                                    }}
                                />
                            </div>

                            {useDenominations ? (
                                <DenominationCounter
                                    value={denominations}
                                    onChange={handleDenominationChange}
                                />
                            ) : (
                                <>
                                    {/* Efectivo esperado */}
                                    <div className="bg-muted p-4 rounded-lg">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Esperado en Sistema:</span>
                                            <span className="font-bold text-lg">{formatCurrency(expectedCash)}</span>
                                        </div>
                                    </div>

                                    {/* Input manual */}
                                    <div className="space-y-2">
                                        <Label htmlFor="closingCash">Efectivo Contado (S/)</Label>
                                        <Input
                                            id="closingCash"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="text-lg h-12"
                                            {...register("closingCash", { valueAsNumber: true })}
                                        />
                                        {errors.closingCash && (
                                            <p className="text-sm text-red-500">{errors.closingCash.message}</p>
                                        )}
                                    </div>

                                    {/* Diferencia preview */}
                                    {closingCash > 0 && (
                                        <div className={cn(
                                            "text-sm flex justify-between p-3 rounded-lg border",
                                            Math.abs(difference) <= tolerance
                                                ? "bg-green-500/10 border-green-500/30 text-green-600"
                                                : difference > 0
                                                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                                                    : "bg-red-500/10 border-red-500/30 text-red-600"
                                        )}>
                                            <span className="flex items-center gap-2">
                                                {Math.abs(difference) > tolerance && <AlertTriangle className="h-4 w-4" />}
                                                Diferencia:
                                                {Math.abs(difference) <= tolerance && (
                                                    <span className="text-xs">(dentro de tolerancia)</span>
                                                )}
                                            </span>
                                            <span className="font-bold">
                                                {difference > 0 ? "+" : ""}{formatCurrency(difference)}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {step === "confirm" && (
                        <>
                            <ReconciliationSummary
                                expectedCash={expectedCash}
                                countedCash={closingCash}
                                openingCash={summary.initialCash}
                                totalSales={summary.totalSales}
                                cashSales={summary.cashSales}
                                totalIncome={summary.totalIncome}
                                totalExpenses={summary.totalExpenses}
                            />

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notas de Cierre (opcional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Observaciones sobre el cierre..."
                                    {...register("notes")}
                                />
                            </div>
                        </>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        {step === "count" ? (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setStep("confirm")}
                                    disabled={closingCash <= 0}
                                >
                                    Siguiente
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep("count")}
                                    disabled={isPending}
                                >
                                    Volver
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={isPending}
                                >
                                    {isPending ? "Cerrando..." : "Confirmar Cierre"}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
