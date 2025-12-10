import { z } from "zod"

// Denominaciones de billetes y monedas peruanas
export const denominationSchema = z.object({
    // Billetes
    s200: z.number().min(0).optional(),  // Billetes de S/200
    s100: z.number().min(0).optional(),  // Billetes de S/100
    s50: z.number().min(0).optional(),   // Billetes de S/50
    s20: z.number().min(0).optional(),   // Billetes de S/20
    s10: z.number().min(0).optional(),   // Billetes de S/10
    // Monedas
    c5: z.number().min(0).optional(),    // Monedas de S/5
    c2: z.number().min(0).optional(),    // Monedas de S/2
    c1: z.number().min(0).optional(),    // Monedas de S/1
    c050: z.number().min(0).optional(),  // Monedas de S/0.50
    c020: z.number().min(0).optional(),  // Monedas de S/0.20
    c010: z.number().min(0).optional(),  // Monedas de S/0.10
})

export const openShiftSchema = z.object({
    openingCash: z.number().min(0, "El monto inicial no puede ser negativo"),
    turn: z.string().min(1, "Seleccione un turno"),
    notes: z.string().optional(),
})

export const closeShiftSchema = z.object({
    closingCash: z.number().min(0, "El monto final no puede ser negativo"),
    denominations: denominationSchema.optional(),
    useDenominations: z.boolean().optional(),
    notes: z.string().optional(),
})

export const transactionSchema = z.object({
    amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
    type: z.enum(["INCOME", "EXPENSE", "WITHDRAWAL"]),
    concept: z.string().min(1, "El concepto es requerido"),
    reference: z.string().optional(),
})

export type DenominationInput = z.infer<typeof denominationSchema>
export type OpenShiftInput = z.infer<typeof openShiftSchema>
export type CloseShiftInput = z.infer<typeof closeShiftSchema>
export type TransactionInput = z.infer<typeof transactionSchema>

// Constantes para las denominaciones
export const DENOMINATIONS = [
    { key: "s200" as const, label: "S/ 200", value: 200, type: "bill" },
    { key: "s100" as const, label: "S/ 100", value: 100, type: "bill" },
    { key: "s50" as const, label: "S/ 50", value: 50, type: "bill" },
    { key: "s20" as const, label: "S/ 20", value: 20, type: "bill" },
    { key: "s10" as const, label: "S/ 10", value: 10, type: "bill" },
    { key: "c5" as const, label: "S/ 5", value: 5, type: "coin" },
    { key: "c2" as const, label: "S/ 2", value: 2, type: "coin" },
    { key: "c1" as const, label: "S/ 1", value: 1, type: "coin" },
    { key: "c050" as const, label: "S/ 0.50", value: 0.5, type: "coin" },
    { key: "c020" as const, label: "S/ 0.20", value: 0.2, type: "coin" },
    { key: "c010" as const, label: "S/ 0.10", value: 0.1, type: "coin" },
] as const

export type DenominationKey = typeof DENOMINATIONS[number]["key"]

// Helper para calcular el total desde denominaciones
export function calculateTotalFromDenominations(denominations: DenominationInput): number {
    return DENOMINATIONS.reduce((total, denom) => {
        return total + (denominations[denom.key] || 0) * denom.value
    }, 0)
}
