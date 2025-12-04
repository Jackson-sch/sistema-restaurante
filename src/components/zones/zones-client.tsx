"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteZone } from "@/actions/zones"
import { ZoneDialog } from "@/components/zones/zone-dialog"
import { ZoneCard } from "@/components/zones/zone-card"
import type { Zone, Table } from "@prisma/client"

type ZoneWithTables = Zone & {
  tables?: Table[]
}

interface ZonesClientProps {
  initialZones: ZoneWithTables[]
}

export function ZonesClient({ initialZones }: ZonesClientProps) {
  const router = useRouter()
  const [editingZone, setEditingZone] = useState<ZoneWithTables | undefined>(undefined)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleEdit = (zone: ZoneWithTables) => {
    setEditingZone(zone)
    setEditDialogOpen(true)
  }

  const handleDelete = async (zoneId: string) => {
    const result = await deleteZone(zoneId)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleSuccess = () => {
    setEditDialogOpen(false)
    setEditingZone(undefined)
    router.refresh()
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {initialZones?.map((zone) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        {(!initialZones || initialZones.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No hay zonas registradas. Comienza creando una.
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <ZoneDialog
        zone={editingZone}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleSuccess}
      />
    </>
  )
}
