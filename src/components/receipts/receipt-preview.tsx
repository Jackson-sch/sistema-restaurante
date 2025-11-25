"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X, Download, ZoomIn, ZoomOut, RotateCcw, Loader2, Receipt, CheckCircle2 } from "lucide-react"
import type { ReceiptData } from "@/types/receipt"
import { ReceiptTemplate } from "./receipt-template"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface ReceiptPreviewProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: ReceiptData | null
}

type PrintStatus = "idle" | "printing" | "success" | "error"

export function ReceiptPreview({ open, onOpenChange, data }: ReceiptPreviewProps) {
    const [printStatus, setPrintStatus] = useState<PrintStatus>("idle")
    const [zoom, setZoom] = useState(1)

    useEffect(() => {
        if (open) {
            setZoom(1)
            setPrintStatus("idle")
        }
    }, [open])

    useEffect(() => {
        if (!open) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handlePrint()
            }
            if (e.key === "+" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setZoom((z) => Math.min(z + 0.25, 2))
            }
            if (e.key === "-" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setZoom((z) => Math.max(z - 0.25, 0.5))
            }
            if (e.key === "0" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setZoom(1)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [open])

    const handlePrint = useCallback(() => {
        if (!data || printStatus === "printing") return

        setPrintStatus("printing")

        try {
            const receiptContent = document.getElementById("receipt-preview-content")
            if (!receiptContent) {
                console.error("Receipt content not found")
                setPrintStatus("error")
                return
            }

            const printFrame = document.createElement("iframe")
            printFrame.style.position = "absolute"
            printFrame.style.width = "0"
            printFrame.style.height = "0"
            printFrame.style.border = "none"
            document.body.appendChild(printFrame)

            const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document
            if (!printDocument) {
                console.error("Could not access print document")
                document.body.removeChild(printFrame)
                setPrintStatus("error")
                return
            }

            printDocument.open()
            printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Comprobante - ${data.number}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 5mm; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.2; color: #000; background: white; width: 80mm; }
            * { box-sizing: border-box; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .mb-1 { margin-bottom: 2px; }
            .mb-2 { margin-bottom: 4px; }
            .mb-3 { margin-bottom: 6px; }
            .mt-1 { margin-top: 2px; }
            .mt-2 { margin-top: 4px; }
            .mt-3 { margin-top: 6px; }
            .pb-2 { padding-bottom: 4px; }
            .pb-3 { padding-bottom: 6px; }
            .pt-2 { padding-top: 4px; }
            .pt-3 { padding-top: 6px; }
            .py-2 { padding-top: 4px; padding-bottom: 4px; }
            .ml-2 { margin-left: 4px; }
            .ml-4 { margin-left: 8px; }
            .p-4 { padding: 8px; }
            .text-xs { font-size: 10px; }
            .text-sm { font-size: 11px; }
            .text-base { font-size: 12px; }
            .border-t { border-top: 1px dashed #999; }
            .border-b { border-bottom: 1px dashed #999; }
            .border-y { border-top: 1px dashed #999; border-bottom: 1px dashed #999; }
            .border-dashed { border-style: dashed; }
            .border-gray-400 { border-color: #999; }
            .text-gray-500 { color: #777; }
            .text-gray-600 { color: #666; }
            .text-green-700 { color: #15803d; }
            .flex { display: flex; }
            .flex-1 { flex: 1; }
            .justify-between { justify-content: space-between; }
            .space-y-1 > * + * { margin-top: 2px; }
            .italic { font-style: italic; }
            .leading-tight { line-height: 1.2; }
            .font-mono { font-family: 'Courier New', monospace; }
            .font-medium { font-weight: 500; }
            .mb-1\\.5 { margin-bottom: 3px; }
          </style>
        </head>
        <body>${receiptContent.innerHTML}</body>
        </html>
      `)
            printDocument.close()

            printFrame.contentWindow?.focus()
            setTimeout(() => {
                try {
                    printFrame.contentWindow?.print()
                    setPrintStatus("success")
                } catch (e) {
                    console.error("Print failed:", e)
                    setPrintStatus("error")
                }
                setTimeout(() => {
                    document.body.removeChild(printFrame)
                    setTimeout(() => setPrintStatus("idle"), 2000)
                }, 100)
            }, 250)
        } catch (error) {
            console.error("Print error:", error)
            setPrintStatus("error")
            setTimeout(() => setPrintStatus("idle"), 2000)
        }
    }, [data, printStatus])

    const handleDownloadPDF = async () => {
        if (!data) return
        try {
            const { pdf } = await import('@react-pdf/renderer')
            const { ReceiptPDF } = await import('./receipt-pdf')

            const blob = await pdf(<ReceiptPDF data={data} />).toBlob()

            // Create a new blob with explicit PDF MIME type
            const pdfBlob = new Blob([blob], { type: 'application/pdf' })
            const url = URL.createObjectURL(pdfBlob)

            const link = document.createElement('a')
            link.href = url
            link.download = `comprobante-${data.number || 'preview'}.pdf`
            link.type = 'application/pdf'
            document.body.appendChild(link)
            link.click()

            setTimeout(() => {
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
            }, 100)
        } catch (error) {
            console.error('Error generating PDF:', error)
        }
    }

    if (!data) return null

    const getDocumentTypeColor = (type: string) => {
        switch (type) {
            case "FACTURA": return "bg-blue-500/10 text-blue-600 ring-blue-500/20"
            case "BOLETA": return "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20"
            case "TICKET": return "bg-amber-500/10 text-amber-600 ring-amber-500/20"
            default: return "bg-zinc-500/10 text-zinc-600 ring-zinc-500/20"
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background border-border shadow-2xl sm:rounded-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-muted/30">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold tracking-tight">Vista Previa del Comprobante</DialogTitle>
                                <DialogDescription className="text-muted-foreground mt-0.5 flex items-center gap-2">
                                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset", getDocumentTypeColor(data.type))}>
                                        {data.type}
                                    </span>
                                    <span className="text-xs">{data.number} • {format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} disabled={zoom <= 0.5} className="h-8 w-8 p-0">
                            <ZoomOut className="h-4 w-4" />
                            <span className="sr-only">Reducir zoom</span>
                        </Button>
                        <span className="text-xs font-medium text-muted-foreground min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                        <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(z + 0.25, 2))} disabled={zoom >= 2} className="h-8 w-8 p-0">
                            <ZoomIn className="h-4 w-4" />
                            <span className="sr-only">Aumentar zoom</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setZoom(1)} className="h-8 w-8 p-0" disabled={zoom === 1}>
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="sr-only">Restablecer zoom</span>
                        </Button>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⌘P</kbd>
                        <span>Imprimir</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-muted/40">
                    <div className="flex justify-center min-h-full items-start">
                        <div id="receipt-preview-content" className="bg-white shadow-lg ring-1 ring-black/5 rounded-sm transition-transform duration-200 origin-top" style={{ transform: `scale(${zoom})` }}>
                            <ReceiptTemplate data={data} />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-background flex gap-3 items-center justify-between">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleDownloadPDF}>
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Descargar PDF</span>
                    </Button>

                    <div className="flex gap-2">
                        <Button onClick={() => onOpenChange(false)} variant="ghost" size="sm">
                            <X className="mr-2 h-4 w-4" />
                            Cerrar
                        </Button>
                        <Button onClick={handlePrint} disabled={printStatus === "printing"} size="sm" className={cn("min-w-[120px] transition-all", printStatus === "success" && "bg-emerald-600 hover:bg-emerald-700")}>
                            {printStatus === "printing" ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Imprimiendo...
                                </>
                            ) : printStatus === "success" ? (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Impreso
                                </>
                            ) : (
                                <>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Imprimir
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
