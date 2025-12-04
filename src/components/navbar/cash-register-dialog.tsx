"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { openCashRegister, closeCashRegister } from "@/actions/quick-actions"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils"

interface CashRegisterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "open" | "close"
  currentSession?: {
    id: string
    openedAt: Date
    openingCash: number
  } | null
  onSuccess: () => void
}

export function CashRegisterDialog({
  open,
  onOpenChange,
  mode,
  currentSession,
  onSuccess
}: CashRegisterDialogProps) {
  const [loading, setLoading] = useState(false)
  const [openingCash, setOpeningCash] = useState("")
  const [closingCash, setClosingCash] = useState("")
  const [turn, setTurn] = useState<string>("")
  const [notes, setNotes] = useState("")

  const handleOpen = async () => {
    if (!openingCash || Number(openingCash) < 0) {
      toast.error("Ingresa un monto válido")
      return
    }

    setLoading(true)
    const result = await openCashRegister(Number(openingCash), turn || undefined)
    setLoading(false)

    if (result.success) {
      toast.success("Caja aperturada correctamente")
      setOpeningCash("")
      setTurn("")
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error(result.error || "Error al abrir caja")
    }
  }

  const handleClose = async () => {
    if (!closingCash || Number(closingCash) < 0) {
      toast.error("Ingresa un monto válido")
      return
    }

    if (!currentSession) {
      toast.error("No hay sesión activa")
      return
    }

    setLoading(true)
    const result = await closeCashRegister(currentSession.id, Number(closingCash), notes || undefined)
    setLoading(false)

    if (result.success) {
      toast.success("Caja cerrada correctamente")
      setClosingCash("")
      setNotes("")
      onOpenChange(false)
      onSuccess()
    } else {
      toast.error(result.error || "Error al cerrar caja")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {mode === "open" ? (
          <>
            <DialogHeader>
              <DialogTitle>Aperturar Caja</DialogTitle>
              <DialogDescription>
                Ingresa el monto inicial con el que abrirás la caja.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="openingCash">Monto Inicial *</Label>
                <Input
                  id="openingCash"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="turn">Turno (Opcional)</Label>
                <Select value={turn} onValueChange={setTurn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAÑANA">Mañana</SelectItem>
                    <SelectItem value="TARDE">Tarde</SelectItem>
                    <SelectItem value="NOCHE">Noche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleOpen} disabled={loading}>
                {loading ? "Abriendo..." : "Abrir Caja"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Cerrar Caja</DialogTitle>
              <DialogDescription>
                Realiza el conteo final y cierra la caja del día.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {currentSession && (
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <p className="text-sm text-muted-foreground">Monto Inicial</p>
                  <p className="text-lg font-semibold">{formatCurrency(currentSession.openingCash)}</p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="closingCash">Monto Final *</Label>
                <Input
                  id="closingCash"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notas (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Observaciones sobre el cierre..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleClose} disabled={loading}>
                {loading ? "Cerrando..." : "Cerrar Caja"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
