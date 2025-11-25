import { z } from "zod"

export const receiptSeriesSchema = z.object({
    type: z.enum(["BOLETA", "FACTURA", "NOTA_VENTA", "TICKET"]),
    series: z.string()
        .min(4, "La serie debe tener al menos 4 caracteres")
        .max(4, "La serie debe tener máximo 4 caracteres")
        .regex(/^[A-Z0-9]+$/, "Solo letras mayúsculas y números"),
    currentNumber: z.number().min(0, "El número actual no puede ser negativo"),
    active: z.boolean().default(true),
})

export type ReceiptSeriesInput = z.infer<typeof receiptSeriesSchema>
