"use client"

import { useTransition, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { restaurantSettingsSchema, type RestaurantSettingsInput } from "@/lib/schemas/settings"
import { updateRestaurantSettings } from "@/actions/settings"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RestaurantFormProps {
    initialData: {
        name: string
        address?: string | null
        phone?: string | null
        email?: string | null
        ruc?: string | null
        businessType?: string | null
        logo?: string | null
    }
}

export function RestaurantForm({ initialData }: RestaurantFormProps) {
    const [isPending, startTransition] = useTransition()
    const [logoPreview, setLogoPreview] = useState<string | null>(initialData.logo || null)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<RestaurantSettingsInput>({
        resolver: zodResolver(restaurantSettingsSchema),
        defaultValues: {
            name: initialData.name,
            address: initialData.address || "",
            phone: initialData.phone || "",
            email: initialData.email || "",
            ruc: initialData.ruc || "",
            businessType: initialData.businessType || "",
            logo: initialData.logo || "",
        },
    })

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                setLogoPreview(base64)
                setValue("logo", base64)
            }
            reader.readAsDataURL(file)
        }
    }

    const onSubmit = (data: RestaurantSettingsInput) => {
        startTransition(async () => {
            const result = await updateRestaurantSettings(data)
            if (result.success) {
                toast.success("Configuración actualizada")
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Datos del Restaurante</CardTitle>
                <CardDescription>
                    Información general de tu negocio.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex flex-col items-center gap-4 mb-6">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-muted bg-muted flex items-center justify-center">
                            {logoPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={logoPreview}
                                    alt="Logo"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-muted-foreground text-xs">Sin Logo</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="logo-upload" className="cursor-pointer">
                                <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                                    Cambiar Logo
                                </div>
                                <Input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                            </Label>
                            {logoPreview && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 h-auto p-0 hover:bg-transparent hover:text-red-600"
                                    onClick={() => {
                                        setLogoPreview(null)
                                        setValue("logo", "")
                                    }}
                                >
                                    Eliminar
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Restaurante</Label>
                            <Input id="name" {...register("name")} />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="businessType">Tipo de Negocio</Label>
                            <Select
                                onValueChange={(val) => setValue("businessType", val)}
                                defaultValue={initialData.businessType || undefined}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RESTAURANT">Restaurante General</SelectItem>
                                    <SelectItem value="CEVICHERIA">Cevichería</SelectItem>
                                    <SelectItem value="POLLERIA">Pollería</SelectItem>
                                    <SelectItem value="CHIFA">Chifa</SelectItem>
                                    <SelectItem value="PIZZERIA">Pizzería</SelectItem>
                                    <SelectItem value="CAFE">Cafetería</SelectItem>
                                    <SelectItem value="BAR">Bar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ruc">RUC</Label>
                            <Input id="ruc" {...register("ruc")} placeholder="11 dígitos" />
                            {errors.ruc && (
                                <p className="text-sm text-red-500">{errors.ruc.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" {...register("phone")} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Dirección</Label>
                            <Input id="address" {...register("address")} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="email">Email de Contacto</Label>
                            <Input id="email" type="email" {...register("email")} />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
