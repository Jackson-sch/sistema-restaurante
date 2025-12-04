"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import Link from "next/link"
import { ReceiptTemplate } from "@/components/receipts/receipt-template"
import type { ReceiptData } from "@/types/receipt"

interface ReceiptPageClientProps {
  receiptData: ReceiptData
}

export function ReceiptPageClient({ receiptData }: ReceiptPageClientProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-muted/40 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header - Hidden when printing */}
        <div className="flex items-center justify-between print:hidden">
          <Link href="/dashboard/tables">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Receipt */}
        <div className="bg-white shadow-lg rounded-lg p-8 print:shadow-none print:rounded-none print:p-0">
          <ReceiptTemplate data={receiptData} />
        </div>
      </div>
    </div>
  )
}
