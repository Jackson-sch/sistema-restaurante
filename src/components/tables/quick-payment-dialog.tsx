"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
import { processQuickPayment, getReceiptSeries } from "@/actions/order-details"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { CreditCard, Banknote, Smartphone, Building2, ArrowLeftRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuickPaymentDialogProps {
  orderId: string
  orderNumber: string
  totalAmount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function QuickPaymentDialog({
  orderId,
  orderNumber,
  totalAmount,
  open,
  onOpenChange,
  onSuccess
}: QuickPaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [receiptType, setReceiptType] = useState("NOTA_VENTA")
  const [amountReceived, setAmountReceived] = useState(totalAmount.toString())
  const [customerDoc, setCustomerDoc] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const router = useRouter()

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setAmountReceived(totalAmount.toString())
      setPaymentMethod("CASH")
      setReceiptType("NOTA_VENTA")
      setCustomerDoc("")
      setCustomerName("")
      setCustomerAddress("")
      setReference("")
      setNotes("")
    }
  }, [open, totalAmount])

  // Auto-fill customer data for Ticket and fetch receipt series
  useEffect(() => {
    if (receiptType === "NOTA_VENTA") {
      setCustomerDoc("00000000")
      setCustomerName("Publico General")
      setCustomerAddress("")
    } else {
      if (customerDoc === "00000000") setCustomerDoc("")
      if (customerName === "Publico General") setCustomerName("")
    }

    // Fetch receipt series preview
    const fetchSeriesPreview = async () => {
      const result = await getReceiptSeries(receiptType)
      if (result.success && result.data) {
        setReceiptPreview(result.data.previewNumber)
      } else {
        setReceiptPreview(null)
      }
    }

    fetchSeriesPreview()
  }, [receiptType])



  const change = Number(amountReceived) - totalAmount

  const handleSubmit = async () => {
    if (Number(amountReceived) < totalAmount) {
      toast.error("El monto recibido debe ser mayor o igual al total")
      return
    }

    if (receiptType === "FACTURA" && (!customerDoc || !customerName)) {
      toast.error("Para factura se requiere RUC y Razón Social")
      return
    }

    if (receiptType === "BOLETA" && !customerDoc) {
      toast.error("Para boleta se requiere DNI")
      return
    }

    setLoading(true)
    const result = await processQuickPayment(orderId, {
      method: paymentMethod,
      amount: totalAmount,
      receiptType,
      customerDoc: customerDoc || undefined,
      customerName: customerName || undefined,
      customerAddress: customerAddress || undefined,
      reference: reference || undefined,
      notes: notes || undefined
    })

    setLoading(false)

    if (result.success) {
      toast.success("Pago procesado correctamente")
      onOpenChange(false)
      onSuccess?.()

      // Redirect to receipt page if payment ID is available
      if (result.data?.payment?.id) {
        router.push(`/dashboard/receipts/${result.data.payment.id}`)
      }
    } else {
      toast.error(result.error || "Error al procesar el pago")
    }
  }

  const paymentMethods = [
    { value: "CASH", label: "Efectivo", icon: Banknote },
    { value: "CARD", label: "Tarjeta", icon: CreditCard },
    { value: "YAPE", label: "Yape", icon: Smartphone },
    { value: "PLIN", label: "Plin", icon: Smartphone },
    { value: "TRANSFER", label: "Transferencia", icon: Building2 },
    { value: "MIXED", label: "Mixto", icon: ArrowLeftRight },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Orden {orderNumber} - {formatCurrency(totalAmount)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Método de Pago *</Label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <Button
                      key={method.value}
                      type="button"
                      variant={paymentMethod === method.value ? "default" : "outline"}
                      className="flex flex-col h-auto py-3"
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span className="text-xs">{method.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Receipt Type */}
            <div className="space-y-2">
              <Label htmlFor="receiptType">Tipo de Comprobante *</Label>
              <Select value={receiptType} onValueChange={setReceiptType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTA_VENTA">Nota de Venta (Ticket)</SelectItem>
                  <SelectItem value="BOLETA">Boleta</SelectItem>
                  <SelectItem value="FACTURA">Factura</SelectItem>
                </SelectContent>
              </Select>
              {receiptPreview && (
                <p className="text-sm text-muted-foreground">
                  Número de comprobante: <span className="font-semibold">{receiptPreview}</span>
                </p>
              )}
            </div>

            {/* Customer Info */}
            {receiptType !== "NOTA_VENTA" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customerDoc">
                    {receiptType === "FACTURA" ? "RUC *" : "DNI *"}
                  </Label>
                  <Input
                    id="customerDoc"
                    value={customerDoc}
                    onChange={(e) => setCustomerDoc(e.target.value)}
                    placeholder={receiptType === "FACTURA" ? "20123456789" : "12345678"}
                    maxLength={receiptType === "FACTURA" ? 11 : 8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    {receiptType === "FACTURA" ? "Razón Social *" : "Nombre Completo *"}
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={receiptType === "FACTURA" ? "Empresa SAC" : "Juan Pérez"}
                  />
                </div>
                {receiptType === "FACTURA" && (
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress">Dirección</Label>
                    <Input
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Av. Principal 123"
                    />
                  </div>
                )}
              </>
            )}

            {/* Amount Received (for cash) */}
            {paymentMethod === "CASH" && (
              <div className="space-y-2">
                <Label htmlFor="amountReceived">Monto Recibido *</Label>
                <Input
                  id="amountReceived"
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                />
                {change >= 0 && (
                  <p className="text-sm text-muted-foreground">
                    Vuelto: <span className="font-semibold">{formatCurrency(change)}</span>
                  </p>
                )}
              </div>
            )}

            {/* Reference (for electronic payments) */}
            {["CARD", "YAPE", "PLIN", "TRANSFER"].includes(paymentMethod) && (
              <div className="space-y-2">
                <Label htmlFor="reference">Número de Operación</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="123456789"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Procesando..." : `Confirmar Pago ${formatCurrency(totalAmount)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  )
}
