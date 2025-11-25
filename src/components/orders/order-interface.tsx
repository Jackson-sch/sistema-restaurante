"use client"

import { useState } from "react"
import type { Category, Product, ProductVariant, ModifierGroup, Modifier, ProductModifierGroup } from "@prisma/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
    Coffee,
    UtensilsCrossed,
    IceCream,
    Beer,
    LayoutGrid,
    Search,
    ShoppingBag,
    Menu,
    Layers
} from "lucide-react"
import { ProductGrid } from "./product-grid"
import { OrderCart } from "./order-cart"
import type { CartItem } from "@/types/order"
import type { TableData } from "./table-selector"

export type ProductWithRelations = Product & {
    variants: ProductVariant[]
    modifierGroups: (ProductModifierGroup & {
        modifierGroup: ModifierGroup & {
            modifiers: Modifier[]
        }
    })[]
}

interface OrderInterfaceProps {
    categories: Category[]
    products: ProductWithRelations[]
    tables: TableData[]
    onOrderCreated?: () => void
    onRefreshTables?: () => void
}

// Internal type for adding items with full Prisma types - exported for use in child components
export type CartItemInput = {
    tempId: string
    product: ProductWithRelations
    variant?: ProductVariant
    modifiers: Modifier[]
    quantity: number
    notes?: string
}

// Map category names to icons (helper function)
const getCategoryIcon = (name: string) => {
    const normalized = name.toLowerCase()
    if (normalized.includes("bebida") || normalized.includes("drink") || normalized.includes("cafe")) return Coffee
    if (normalized.includes("comida") || normalized.includes("food") || normalized.includes("burger"))
        return UtensilsCrossed
    if (normalized.includes("postre") || normalized.includes("dessert") || normalized.includes("helado")) return IceCream
    if (normalized.includes("alcohol") || normalized.includes("beer") || normalized.includes("cerveza")) return Beer
    return LayoutGrid
}

export function OrderInterface({ categories, products, tables, onOrderCreated, onRefreshTables }: OrderInterfaceProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedTable, setSelectedTable] = useState<TableData | null>(null)

    const filteredProducts = products.filter((p) => {
        const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const addToCart = (item: CartItemInput) => {
        // Convert Prisma types to plain types for cart storage
        const cartItem: CartItem = {
            tempId: item.tempId,
            product: {
                id: item.product.id,
                name: item.product.name,
                price: Number(item.product.price), // Convert Decimal to number
            },
            variant: item.variant
                ? {
                    id: item.variant.id,
                    name: item.variant.name,
                    price: Number(item.variant.price), // Convert Decimal to number
                }
                : undefined,
            modifiers: item.modifiers.map((m) => ({
                id: m.id,
                name: m.name,
                price: Number(m.price), // Convert Decimal to number
            })),
            quantity: item.quantity,
            notes: item.notes,
        }

        setCart((prev) => {
            const existingIndex = prev.findIndex(
                (i) =>
                    i.product.id === cartItem.product.id &&
                    i.variant?.id === cartItem.variant?.id &&
                    JSON.stringify(i.modifiers.map((m) => m.id).sort()) ===
                    JSON.stringify(cartItem.modifiers.map((m) => m.id).sort()) &&
                    i.notes === cartItem.notes,
            )

            if (existingIndex >= 0) {
                const newCart = [...prev]
                newCart[existingIndex].quantity += cartItem.quantity
                return newCart
            }

            return [...prev, cartItem]
        })
    }

    const removeFromCart = (tempId: string) => {
        setCart((prev) => prev.filter((item) => item.tempId !== tempId))
    }

    const updateQuantity = (tempId: string, delta: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.tempId === tempId) {
                    const newQuantity = Math.max(1, item.quantity + delta)
                    return { ...item, quantity: newQuantity }
                }
                return item
            }),
        )
    }

    const clearCart = () => {
        setCart([])
    }

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
            {/* Left Side: Sidebar Navigation */}
            <aside className="w-20 lg:w-24 border-r flex flex-col items-center py-6 bg-card z-30">
                <div className="mb-8 p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <Layers className="h-6 w-6" />
                </div>

                <nav className="flex-1 flex flex-col gap-4 w-full px-2">
                    <button
                        onClick={() => setSelectedCategory("all")}
                        className={cn(
                            "group flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-200",
                            selectedCategory === "all"
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                    >
                        <LayoutGrid className="h-6 w-6" />
                        <span className="text-[10px] font-medium">Todos</span>
                    </button>

                    {categories.map((cat) => {
                        const Icon = getCategoryIcon(cat.name)
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "group flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all duration-200",
                                    selectedCategory === cat.id
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                )}
                            >
                                <Icon className="h-6 w-6" />
                                <span className="text-[10px] font-medium truncate w-full text-center">{cat.name.slice(0, 8)}</span>
                            </button>
                        )
                    })}
                </nav>

                <div className="mt-auto">
                    <button className="p-3 rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </aside>

            {/* Middle: Product Grid */}
            <main className="flex-1 flex flex-col bg-muted/10 h-full overflow-hidden relative">
                {/* Header with Search */}
                <header className="h-20 px-8 flex items-center justify-between bg-background/50 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {selectedCategory === "all"
                                ? "Todos los productos"
                                : categories.find((c) => c.id === selectedCategory)?.name || "Menú"}
                        </h1>
                        <p className="text-sm text-muted-foreground">{filteredProducts.length} productos disponibles</p>
                    </div>

                    <div className="relative w-96 hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar productos..."
                            className="pl-10 bg-background border-muted hover:border-primary/50 transition-colors rounded-full h-11"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </header>

                {/* Grid Content */}
                <div className="flex-1 overflow-hidden p-6 pt-2">
                    <ScrollArea className="h-full pr-4 -mr-4">
                        <div className="pb-20">
                            <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
                        </div>
                    </ScrollArea>
                </div>
            </main>

            {/* Right Side: Cart */}
            <aside className="w-[400px] xl:w-[450px] bg-background border-l shadow-xl shadow-black/5 z-20 flex flex-col h-full">
                <OrderCart
                    items={cart}
                    onRemove={removeFromCart}
                    onUpdateQuantity={updateQuantity}
                    onClear={clearCart}
                    onOrderCreated={onOrderCreated}
                    onRefreshTables={onRefreshTables}
                    tables={tables}
                    selectedTable={selectedTable}
                    onTableChange={setSelectedTable}
                />
            </aside>
        </div>
    )
}
