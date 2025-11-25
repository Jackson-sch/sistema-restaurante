import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Helper function to create a sortable column header
 */
export function createSortableHeader(label: string) {
    return ({ column }: any) => {
        return (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                {label}
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        )
    }
}

/**
 * Helper function to format currency in PEN (Peruvian Soles)
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
    }).format(amount)
}

/**
 * Helper function to format date
 */
export function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(new Date(date))
}

/**
 * Helper function to format date and time
 */
export function formatDateTime(date: Date | string): string {
    return new Intl.DateTimeFormat("es-PE", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date))
}
