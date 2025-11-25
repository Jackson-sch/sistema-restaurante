"use client"

import type React from "react"

import { useState } from "react"
import type { ProductWithRelations, CartItemInput } from "./order-interface"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { ProductDialog } from "./product-dialog"
import Image from "next/image"
import { Plus, Sparkles, ShoppingCart } from "lucide-react"

interface ProductCardProps {
    product: ProductWithRelations
    onAddToCart: (item: CartItemInput) => void
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    const hasOptions = product.variants.length > 0 || product.modifierGroups.length > 0

    const handleClick = () => {
        // Always open dialog to allow adding notes and selecting quantity
        setIsDialogOpen(true)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
        }
    }

    return (
        <>
            <Card
                className={`relative cursor-pointer group overflow-hidden transition-all duration-300 h-full flex flex-col bg-card ${isHovered ? "shadow-2xl shadow-primary/10 -translate-y-2 ring-2 ring-primary/20" : "shadow-md hover:shadow-lg"
                    }`}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-label={`${product.name}, ${formatCurrency(Number(product.price))}${hasOptions ? ", con opciones disponibles" : ""}`}
            >
                {/* Image Container */}
                <div className="aspect-[4/3] relative bg-muted/30 overflow-hidden">
                    {product.image ? (
                        <>
                            {!imageLoaded && (
                                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted/60 to-muted" />
                            )}
                            <Image
                                src={product.image || "/placeholder.svg"}
                                alt={product.name}
                                fill
                                className={`object-cover transition-all duration-700 ${isHovered ? "scale-105 brightness-95" : "scale-100"
                                    } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                                onLoad={() => setImageLoaded(true)}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted/50">
                            <div className="text-7xl font-bold text-muted-foreground/20">{product.name.charAt(0).toUpperCase()}</div>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                    {hasOptions && (
                        <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm border-0 shadow-lg text-primary-foreground font-medium text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Opciones
                        </Badge>
                    )}

                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? "opacity-100 bg-black/30" : "opacity-0 pointer-events-none"
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2 transform transition-all duration-300 scale-90 group-hover:scale-100">
                            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-2xl ring-4 ring-primary/20">
                                {hasOptions ? (
                                    <Sparkles className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
                                ) : (
                                    <Plus className="h-8 w-8 text-primary-foreground" strokeWidth={3} />
                                )}
                            </div>
                            <span className="text-white text-sm font-semibold bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                                {hasOptions ? "Ver opciones" : "Agregar"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col gap-2">
                    <div className="flex-1 space-y-1">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
                            {product.name}
                        </h3>
                        {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-foreground">S/ {Number(product.price).toFixed(2)}</span>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <ShoppingCart className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 bg-primary/5 opacity-0 active:opacity-100 transition-opacity pointer-events-none" />
            </Card>

            <ProductDialog product={product} open={isDialogOpen} onOpenChange={setIsDialogOpen} onAddToCart={onAddToCart} />
        </>
    )
}
