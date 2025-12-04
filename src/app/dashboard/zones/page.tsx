import { getZones } from "@/actions/zones"
import { ZoneDialog } from "@/components/zones/zone-dialog"
import { ZonesClient } from "@/components/zones/zones-client"

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

            <ZonesClient initialZones={zones || []} />
        </div>
    )
}
