"use client"

import { useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    onRemove?: () => void
}

export function ImageUpload({ value, onChange, onRemove }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const data = await response.json()

            if (data.success) {
                onChange(data.url)
                toast.success("Imagen subida correctamente")
            } else {
                toast.error(data.error || "Error al subir la imagen")
            }
        } catch (error) {
            toast.error("Error al subir la imagen")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-2">
            {value ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <Image
                        src={value}
                        alt="Preview"
                        fill
                        className="object-cover"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                            onRemove?.()
                            onChange("")
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {isUploading ? (
                            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-semibold">Click para subir</span> o arrastra y suelta
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG o WebP (máx. 5MB)
                                </p>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </label>
            )}
        </div>
    )
}
