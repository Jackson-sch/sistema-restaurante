import { z } from "zod"

export const restaurantSettingsSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    ruc: z.string().length(11, "El RUC debe tener 11 dígitos").optional().or(z.literal("")),
    businessType: z.string().optional(),
    logo: z.string().optional(),
})

export type RestaurantSettingsInput = z.infer<typeof restaurantSettingsSchema>
