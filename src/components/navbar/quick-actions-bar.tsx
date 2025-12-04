"use client"

import { ActiveOrdersButton } from "./active-orders-button"
import { CashRegisterButton } from "./cash-register-button"
import { NewOrderButton } from "./new-order-button"

interface QuickActionsBarProps {
  categories?: any[]
  products?: any[]
}

export function QuickActionsBar({ categories = [], products = [] }: QuickActionsBarProps) {
  return (
    <div className="flex items-center gap-2">
      {categories.length > 0 && products.length > 0 && (
        <NewOrderButton categories={categories} products={products} />
      )}
      <ActiveOrdersButton />
      <CashRegisterButton />
    </div>
  )
}
