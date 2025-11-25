import { z } from "zod"

export const openShiftSchema = z.object({
    openingCash: z.number().min(0, "El monto inicial no puede ser negativo"),
    turn: z.string().min(1, "Seleccione un turno"),
    notes: z.string().optional(),
})

export const closeShiftSchema = z.object({
    closingCash: z.number().min(0, "El monto final no puede ser negativo"),
    notes: z.string().optional(),
})

export const transactionSchema = z.object({
    amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
    type: z.enum(["INCOME", "EXPENSE", "WITHDRAWAL"]),
    concept: z.string().min(1, "El concepto es requerido"),
    reference: z.string().optional(),
})

export type OpenShiftInput = z.infer<typeof openShiftSchema>
export type CloseShiftInput = z.infer<typeof closeShiftSchema>
export type TransactionInput = z.infer<typeof transactionSchema>
