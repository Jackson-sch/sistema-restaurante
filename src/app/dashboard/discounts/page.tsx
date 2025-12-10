import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DiscountsClient } from "@/components/discounts/discounts-client"

export default async function DiscountsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Fetch discounts
  const discounts = await prisma.discount.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Serialize using JSON to convert Decimals and Dates to plain values
  const serialized = JSON.parse(JSON.stringify(discounts.map(d => ({
    id: d.id,
    code: d.code,
    name: d.name,
    type: d.type,
    value: Number(d.value),
    minOrderAmount: d.minOrderAmount ? Number(d.minOrderAmount) : null,
    maxDiscount: d.maxDiscount ? Number(d.maxDiscount) : null,
    usageLimit: d.usageLimit,
    usageCount: d.usageCount,
    validFrom: d.validFrom.toISOString(),
    validUntil: d.validUntil.toISOString(),
    active: d.active,
    applicableTo: d.applicableTo,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }))))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Descuentos</h1>
          <p className="text-muted-foreground">
            Gestiona códigos de descuento y promociones
          </p>
        </div>
      </div>

      <DiscountsClient initialDiscounts={serialized} />
    </div>
  )
}
