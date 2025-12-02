"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet } from "lucide-react"
import { ReportExportDialog } from "@/components/reports/report-export-dialog"

export function DashboardExportButton() {
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setExportDialogOpen(true)}
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Exportar Reporte
      </Button>

      <ReportExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
    </>
  )
}
