import { getZones, deleteZone } from "@/actions/zones"
import { ZoneDialog } from "@/components/zones/zone-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Trash2 } from "lucide-react"
import { ZoneCard } from "@/components/zones/zone-card"

export default async function ZonesPage() {
    const { data: zones } = await getZones()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Zonas</h1>
                    <p className="text-muted-foreground">
                        Gestiona las áreas de tu restaurante.
                    </p>
                </div>
                <ZoneDialog />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {zones?.map((zone) => (
                    <ZoneCard key={zone.id} zone={zone} />
                ))}
                {(!zones || zones.length === 0) && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No hay zonas registradas. Comienza creando una.
                    </div>
                )}
            </div>
        </div>
    )
}
