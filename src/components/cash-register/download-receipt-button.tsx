"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { pdf } from "@react-pdf/renderer"
import { ShiftCloseReceiptPDF } from "./shift-close-receipt-pdf"
import { type DenominationInput } from "@/lib/schemas/cash-register"

interface ShiftData {
  id: string
  turn: string | null
  openingCash: number
  closingCash: number | null
  expectedCash: number | null
  difference: number | null
  openedAt: Date
  closedAt: Date | null
  denominationBreakdown: DenominationInput | null
  user: { name: string | null }
  summary: {
    totalSales: number
    cashSales: number
    cardSales: number
    otherSales: number
    totalIncome: number
    totalExpenses: number
  }
  transactions: Array<{
    id: string
    type: string
    amount: number
    concept: string
    createdAt: Date
  }>
}

interface RestaurantData {
  name: string
  address?: string | null
  phone?: string | null
  ruc?: string | null
}

interface DownloadReceiptButtonProps {
  shift: ShiftData
  restaurant: RestaurantData
}

export function DownloadReceiptButton({ shift, restaurant }: DownloadReceiptButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const blob = await pdf(
        <ShiftCloseReceiptPDF shift={shift} restaurant={restaurant} />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `cierre-caja-${shift.id.slice(-6)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Descargar Recibo
        </>
      )}
    </Button>
  )
}
