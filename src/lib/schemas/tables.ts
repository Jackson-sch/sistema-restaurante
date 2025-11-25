import { z } from "zod"

export const tableSchema = z.object({
    number: z.string().min(1, "El número de mesa es requerido"),
    capacity: z.number().min(1, "La capacidad debe ser al menos 1 persona"),
    status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]),
    zoneId: z.string().optional(),
})

export type TableInput = z.infer<typeof tableSchema>
