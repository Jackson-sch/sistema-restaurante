"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { ComboDialog } from "./combo-dialog"
import { createCombo, updateCombo, deleteCombo, toggleComboActive } from "@/actions/combos"
import { toast } from "sonner"
// import { Combo } from "@prisma/client" // Usaremos un tipo extendido

// Tipo extendido para incluir productos
export type ComboWithProducts = {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
  products: {
    productId: string
    quantity: number
    product: {
      id: string
      name: string
      price: number
      image: string | null
    }
  }[]
}

interface CombosClientProps {
  initialCombos: ComboWithProducts[]
  products: { id: string; name: string; price: number; image: string | null; category: string }[]
}

export function CombosClient({ initialCombos, products }: CombosClientProps) {
  const [combos, setCombos] = useState<ComboWithProducts[]>(initialCombos)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<ComboWithProducts | null>(null)

  const handleEdit = (combo: ComboWithProducts) => {
    setEditingCombo(combo)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este combo?")) {
      const result = await deleteCombo(id)
      if (result.success) {
        setCombos(combos.filter((c) => c.id !== id))
        toast.success("Combo eliminado correctamente")
      } else {
        toast.error("Error al eliminar el combo")
      }
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const result = await toggleComboActive(id, !currentStatus)
    if (result.success) {
      setCombos(combos.map((c) => (c.id === id ? { ...c, active: !currentStatus } : c)))
      toast.success(`Combo ${!currentStatus ? "activado" : "desactivado"}`)
    } else {
      toast.error("Error al actualizar estado")
    }
  }

  const handleCreate = async (data: any) => {
    const result = await createCombo(data)
    if (result.success && result.data) {
      // Necesitamos recargar o añadir a la lista. 
      // Como la respuesta createCombo no devuelve la estructura completa con relaciones anidadas tan profundas (a veces), 
      // lo mejor es confiar en el revalidatePath del server action y router.refresh() si usáramos router, 
      // pero aquí estamos actualizando estado local.
      // Para simplificar, añadimos el objeto devuelto asumiendo que el server action devuelve lo necesario o recargamos página.
      // Lo ideal es router.refresh().
      location.reload();
    } else {
      toast.error(result.error)
    }
  }

  const handleUpdate = async (id: string, data: any) => {
    const result = await updateCombo(id, data)
    if (result.success) {
      location.reload();
    } else {
      toast.error(result.error)
    }
  }


  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditingCombo(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Combo
        </Button>
      </div>

      <DataTable
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete, onToggleActive: handleToggleActive })}
        data={combos}
        searchKey="name"
      />

      <ComboDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        products={products}
        combo={editingCombo}
        onSubmit={editingCombo ? (data) => handleUpdate(editingCombo.id, data) : handleCreate}
      />
    </>
  )
}
