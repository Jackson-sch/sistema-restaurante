import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { error: "No se proporcionó ningún archivo" },
                { status: 400 }
            )
        }

        // Validar tipo de archivo
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y WebP" },
                { status: 400 }
            )
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "El archivo es demasiado grande. Máximo 5MB" },
                { status: 400 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generar nombre único
        const timestamp = Date.now()
        const originalName = file.name.replace(/\s+/g, "-")
        const fileName = `${timestamp}-${originalName}`

        // Crear directorio si no existe
        const uploadDir = path.join(process.cwd(), "public", "uploads")
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (error) {
            // Directory might already exist
        }

        // Guardar archivo
        const filePath = path.join(uploadDir, fileName)
        await writeFile(filePath, buffer)

        // Retornar URL pública
        const publicUrl = `/uploads/${fileName}`

        return NextResponse.json({
            success: true,
            url: publicUrl
        })
    } catch (error) {
        console.error("Error al subir archivo:", error)
        return NextResponse.json(
            { error: "Error al procesar el archivo" },
            { status: 500 }
        )
    }
}
