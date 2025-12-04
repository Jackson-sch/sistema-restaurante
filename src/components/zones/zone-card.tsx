"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Users, LayoutGrid, QrCode, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useTransition, useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Types based on the data structure shown
interface Table {
    id: string
    number: string
    capacity: number
    status: string
    qrCode: string | null
    zoneId: string | null
    restaurantId: string
    createdAt: Date
    updatedAt: Date
}

interface Zone {
    id: string
    name: string
    order: number
    restaurantId: string
    createdAt: Date
    tables?: Table[]
}

interface ZoneCardProps {
    zone: Zone
    onEdit?: (zone: Zone) => void
    onDelete?: (zoneId: string) => Promise<{ success: boolean; error?: string }>
}

const statusConfig = {
    AVAILABLE: { label: "Disponible", className: "bg-emerald-500/15 text-emerald-700 border-emerald-200" },
    OCCUPIED: { label: "Ocupada", className: "bg-amber-500/15 text-amber-700 border-amber-200" },
    RESERVED: { label: "Reservada", className: "bg-blue-500/15 text-blue-700 border-blue-200" },
    MAINTENANCE: { label: "Mantenimiento", className: "bg-red-500/15 text-red-700 border-red-200" },
}

export function ZoneCard({ zone, onEdit, onDelete }: ZoneCardProps) {
    const [isPending, startTransition] = useTransition()
    const [isHovered, setIsHovered] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const tables = zone.tables || []
    const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0)
    const availableTables = tables.filter((t) => t.status === "AVAILABLE").length
    const tablesWithQR = tables.filter((t) => t.qrCode).length

    const handleDeleteConfirm = () => {
        startTransition(async () => {
            if (onDelete) {
                const result = await onDelete(zone.id)
                if (result.success) {
                    toast.success("Zona eliminada correctamente")
                } else {
                    toast.error(result.error || "Error al eliminar la zona")
                }
            }
            setDeleteDialogOpen(false)
        })
    }

    return (
        <>
            <Card
                className="group relative overflow-hidden transition-all duration-200 hover:shadow-md"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-lg font-semibold capitalize tracking-tight">{zone.name}</h3>
                            <Badge variant="secondary" className="shrink-0 text-xs font-normal">
                                #{zone.order}
                            </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {tables.length} {tables.length === 1 ? "mesa" : "mesas"}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div
                        className={`flex gap-1 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0 sm:opacity-0"
                            }`}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => onEdit?.(zone)}
                        >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar zona</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={isPending}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar zona</span>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="grid grid-cols-3 gap-3 pt-0">
                    {/* Capacity stat */}
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background">
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-none">{totalCapacity}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">Capacidad</p>
                        </div>
                    </div>

                    {/* Available tables stat */}
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background">
                            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-none">
                                {availableTables}/{tables.length}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">Libres</p>
                        </div>
                    </div>

                    {/* QR codes stat */}
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background">
                            <QrCode className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium leading-none">{tablesWithQR}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">Con QR</p>
                        </div>
                    </div>
                </CardContent>

                {/* Tables preview */}
                {tables.length > 0 && (
                    <div className="border-t px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                            {tables.slice(0, 8).map((table) => (
                                <Badge
                                    key={table.id}
                                    variant="outline"
                                    className={`text-xs font-normal ${statusConfig[table.status as keyof typeof statusConfig]?.className || 'bg-gray-100 text-gray-800'}`}
                                >
                                    Mesa {table.number}
                                </Badge>
                            ))}
                            {tables.length > 8 && (
                                <Badge variant="outline" className="text-xs font-normal">
                                    +{tables.length - 8} más
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            ¿Eliminar zona "{zone.name}"?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {tables.length > 0 ? (
                                <>
                                    Esta zona tiene <strong>{tables.length} mesa(s)</strong> asociada(s).
                                    <br />
                                    Esta acción no se puede deshacer.
                                </>
                            ) : (
                                "Esta acción no se puede deshacer."
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isPending}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isPending ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
