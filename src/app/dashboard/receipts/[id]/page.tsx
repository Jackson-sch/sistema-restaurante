import { notFound } from "next/navigation"
import { getReceiptData } from "@/actions/receipts"
import { ReceiptPageClient } from "./receipt-page-client"

interface ReceiptPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params
  const receiptData = await getReceiptData(id)

  if (!receiptData) {
    notFound()
  }

  return <ReceiptPageClient receiptData={receiptData} />
}
