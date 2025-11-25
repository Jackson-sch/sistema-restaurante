"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { loginSchema, type LoginInput } from "@/lib/schemas/auth"
import { signInWithCredentials } from "@/actions/auth"

export function LoginForm() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const onSubmit = (data: LoginInput) => {
        setError(null)
        startTransition(async () => {
            try {
                const result = await signInWithCredentials(data.email, data.password)
                if (result.error) {
                    setError(result.error)
                } else {
                    // Redirect is handled in server action/page, but we can force refresh
                    router.refresh()
                }
            } catch (err) {
                setError("Ocurrió un error inesperado")
            }
        })
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
                <CardDescription className="text-center">
                    Ingresa tus credenciales para acceder al sistema
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="nombre@ejemplo.com"
                            disabled={isPending}
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            disabled={isPending}
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? "Iniciando sesión..." : "Ingresar"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">
                    ¿No tienes una cuenta?{" "}
                    <Link href="/register" className="text-primary hover:underline font-medium">
                        Regístrate
                    </Link>
                </p>
            </CardFooter>
        </Card>
    )
}
