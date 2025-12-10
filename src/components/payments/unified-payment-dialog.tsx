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
import { registerPayment } from "@/actions/payments"
import { getReceiptSeries } from "@/actions/receipt-series"
import { getReceiptData } from "@/actions/receipts"
import { applyDiscountToOrder } from "@/actions/discounts"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { CreditCard, Banknote, Smartphone, Building2, ArrowLeftRight, Loader2, Tag } from "lucide-react"
import { ReceiptPreview } from "@/components/receipts/receipt-preview"
import type { ReceiptData } from "@/types/receipt"

export interface UnifiedPaymentDialogProps {
  orderId: string
  orderNumber: string
  totalAmount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  tableInfo?: string // Optional: "Mesa 1 - Zona A"
}

const paymentMethods = [
  { value: "CASH", label: "Efectivo", icon: Banknote },
  { value: "CARD", label: "Tarjeta", icon: CreditCard },
  { value: "YAPE", label: "Yape", icon: Smartphone },
  { value: "PLIN", label: "Plin", icon: Smartphone },
  { value: "TRANSFER", label: "Transferencia", icon: Building2 },
  { value: "MIXED", label: "Mixto", icon: ArrowLeftRight },
]

export function UnifiedPaymentDialog({
  orderId,
  orderNumber,
  totalAmount,
  open,
  onOpenChange,
  onSuccess,
  tableInfo,
}: UnifiedPaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [receiptType, setReceiptType] = useState("NOTA_VENTA")

  // Amount state
  const [currentTotal, setCurrentTotal] = useState(totalAmount)
  const [amountReceived, setAmountReceived] = useState(totalAmount.toString())

  // Customer
  const [customerDoc, setCustomerDoc] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [seriesList, setSeriesList] = useState<any[]>([])

  // Discount state
  const [discountCode, setDiscountCode] = useState("")
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [appliedDiscount, setAppliedDiscount] = useState<{ amount: number } | null>(null)

  // Receipt preview state
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentTotal(totalAmount)
      setAmountReceived(totalAmount.toString())
      setPaymentMethod("CASH")
      setReceiptType("NOTA_VENTA")
      setCustomerDoc("")
      setCustomerName("")
      setCustomerAddress("")
      setReference("")
      setNotes("")
      setReceiptData(null)
      setShowReceipt(false)
      setDiscountCode("")
      setAppliedDiscount(null)
    }
  }, [open, totalAmount])

  // Fetch receipt series
  useEffect(() => {
    const fetchSeries = async () => {
      const result = await getReceiptSeries()
      if (result.success && result.data) {
        setSeriesList(result.data)
      }
    }
    if (open) {
      fetchSeries()
    }
  }, [open])

  // Auto-fill customer data and fetch receipt series preview
  useEffect(() => {
    if (receiptType === "NOTA_VENTA") {
      setCustomerDoc("00000000")
      setCustomerName("Publico General")
      setCustomerAddress("")
    } else {
      if (customerDoc === "00000000") setCustomerDoc("")
      if (customerName === "Publico General") setCustomerName("")
    }

    // Get series preview
    if (seriesList.length > 0) {
      let series = seriesList.find(s => s.type === receiptType && s.active)

      // Fallback: If NOTA_VENTA selected but no series found, try TICKET series
      if (!series && receiptType === "NOTA_VENTA") {
        series = seriesList.find(s => s.type === "TICKET" && s.active)
      }

      if (series) {
        const nextNumber = series.currentNumber + 1
        setReceiptPreview(`${series.series}-${nextNumber.toString().padStart(8, '0')}`)
      } else {
        setReceiptPreview(null)
      }
    }
  }, [receiptType, seriesList])

  const change = Number(amountReceived) - currentTotal

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return

    setIsApplyingDiscount(true)
    try {
      const result = await applyDiscountToOrder(orderId, discountCode)
      if (result.success && result.data) {
        toast.success(`Descuento aplicado: -${formatCurrency(result.data.discountAmount)}`)
        setAppliedDiscount({ amount: result.data.discountAmount })
        setCurrentTotal(result.data.newTotal)
        setAmountReceived(result.data.newTotal.toString()) // Auto-update received amount
        setDiscountCode("") // Clear input
      } else {
        toast.error(result.error || "Error al aplicar descuento")
      }
    } catch (error) {
      toast.error("Error al aplicar descuento")
    } finally {
      setIsApplyingDiscount(false)
    }
  }

  const handleSubmit = async () => {
    if (Number(amountReceived) < currentTotal) {
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

    try {
      const result = await registerPayment({
        orderId,
        method: paymentMethod,
        amount: currentTotal, // Use the potentially discounted total
        receiptType,
        receiptNumber: receiptPreview || undefined,
        customerDoc: customerDoc || undefined,
        customerName: customerName || undefined,
        customerAddress: customerAddress || undefined,
        reference: reference || undefined,
        notes: notes || undefined
      })

      // ... (rest of handling)

      if (result.success) {
        toast.success(
          result.paymentStatus === 'PAID'
            ? '¡Pago completado!'
            : `Pago parcial registrado. Pendiente: ${formatCurrency(result.amountDue || 0)}`
        )

        // If we have a paymentId, fetch and show receipt
        if (result.paymentId) {
          const receipt = await getReceiptData(result.paymentId)
          if (receipt) {
            setReceiptData(receipt)
            setShowReceipt(true)
            // Don't close dialog yet - let user print first
            return
          }
        }

        // No receipt to show, complete
        onOpenChange(false)

        // Dispatch events for instant navbar updates
        window.dispatchEvent(new CustomEvent('payment-updated'))
        window.dispatchEvent(new CustomEvent('order-updated'))

        onSuccess?.()
      } else {
        toast.error(result.error || "Error al procesar el pago")
      }
    } catch (error) {
      toast.error("Error al procesar el pago")
    } finally {
      setLoading(false)
    }
  }

  const handleReceiptClose = () => {
    setShowReceipt(false)
    setReceiptData(null)
    onOpenChange(false)

    // Dispatch events for instant navbar updates
    window.dispatchEvent(new CustomEvent('payment-updated'))
    window.dispatchEvent(new CustomEvent('order-updated'))

    onSuccess?.()
  }

  return (
    <>
      <Dialog open={open && !showReceipt} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Orden {orderNumber} - {formatCurrency(totalAmount)}
              {tableInfo && <span className="block text-xs mt-1">{tableInfo}</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Discount Section */}
            {!appliedDiscount ? (
              <div className="flex gap-2 items-end">
                <div className="grid w-full gap-2">
                  <Label htmlFor="discountCode">Cupón de Descuento</Label>
                  <Input
                    id="discountCode"
                    placeholder="INGRESAR CÓDIGO"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    disabled={isApplyingDiscount}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleApplyDiscount}
                  disabled={!discountCode || isApplyingDiscount}
                >
                  {isApplyingDiscount ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Aplicar"
                  )}
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-between text-green-700">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">Descuento aplicado</span>
                </div>
                <span className="font-bold">-{formatCurrency(appliedDiscount.amount)}</span>
              </div>
            )}

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
                  <SelectItem value="NOTA_VENTA">Nota de Venta</SelectItem>
                  <SelectItem value="BOLETA">Boleta</SelectItem>
                  <SelectItem value="FACTURA">Factura</SelectItem>
                </SelectContent>
              </Select>
              {receiptPreview ? (
                <p className="text-sm text-muted-foreground">
                  Número: <span className="font-semibold">{receiptPreview}</span>
                </p>
              ) : (
                <p className="text-sm text-destructive font-medium">
                  ⚠ No hay serie activa configurada para {receiptType}
                </p>
              )}
            </div>

            {/* Customer Info */}
            {receiptType !== "NOTA_VENTA" && receiptType !== "TICKET" && (
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
                    Vuelto: <span className="font-semibold text-green-600">{formatCurrency(change)}</span>
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
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                `Confirmar Pago ${formatCurrency(totalAmount)}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview - shows automatically after payment */}
      <ReceiptPreview
        open={showReceipt}
        onOpenChange={handleReceiptClose}
        data={receiptData}
      />
    </>
  )
}
