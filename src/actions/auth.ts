"use server"

import { signIn, signOut as authSignOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthError } from "next-auth"
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth"

export async function signInWithCredentials(email: string, password: string) {
    try {
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/"
        })
        return { success: true }
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Credenciales inválidas" }
                default:
                    return { error: "Algo salió mal" }
            }
        }
        throw error
    }
}

export async function registerUser(data: RegisterInput) {
    try {
        // Validar datos
        const validatedData = registerSchema.parse(data)

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: {
                email: validatedData.email
            }
        })

        if (existingUser) {
            return { error: "El email ya está registrado" }
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(validatedData.password, 10)

        // Crear usuario
        await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: hashedPassword
            }
        })

        // Iniciar sesión automáticamente
        await signIn("credentials", {
            email: validatedData.email,
            password: validatedData.password,
            redirectTo: "/"
        })

        return { success: true }
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Error al crear la cuenta" }
        }
        throw error
    }
}

export async function signOut() {
    await authSignOut({ redirectTo: "/" })
}