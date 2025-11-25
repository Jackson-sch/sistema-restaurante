import { z } from "zod"

export const zoneSchema = z.object({
    name: z.string().min(1, "El nombre de la zona es requerido"),
    order: z.number().default(0),
})

export type ZoneInput = z.infer<typeof zoneSchema>
