"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { updateCashSettings } from "@/actions/settings"
import { DollarSign, Save } from "lucide-react"

interface CashSettingsFormProps {
  initialSettings?: {
    cashTolerance?: number
  }
}

export function CashSettingsForm({ initialSettings }: CashSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [tolerance, setTolerance] = useState(initialSettings?.cashTolerance ?? 5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateCashSettings({ cashTolerance: tolerance })
      if (result.success) {
        toast.success("Configuración guardada")
      } else {
        toast.error(result.error || "Error al guardar")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configuración de Caja
        </CardTitle>
        <CardDescription>
          Configura los parámetros para el control de caja registradora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tolerance">Tolerancia de Diferencia (S/)</Label>
            <Input
              id="tolerance"
              type="number"
              step="0.50"
              min="0"
              max="100"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Margen de diferencia aceptable al cerrar caja. Las diferencias dentro de este rango se mostrarán en verde.
            </p>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? (
              "Guardando..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
