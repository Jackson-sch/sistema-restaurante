import { Suspense } from "react"
import { getCombos } from "@/actions/combos"
import { CombosClient } from "@/components/combos/combos-client"
import { getProducts } from "@/actions/products" // Necesitaremos productos para el selector

export default async function CombosPage() {
  const [combosResult, productsResult] = await Promise.all([
    getCombos(),
    getProducts() // Fix: No arguments accepted
  ])

  const combos = (combosResult.success && combosResult.data) ? (combosResult.data as any) : []
  const products = productsResult.data ? productsResult.data.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    category: p.category.name
  })) : []

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Combos</h2>
          <p className="text-muted-foreground">
            Crea y gestiona paquetes de productos a precios especiales
          </p>
        </div>
      </div>
      <Suspense fallback={<div>Cargando...</div>}>
        <CombosClient initialCombos={combos} products={products} />
      </Suspense>
    </div>
  )
}
