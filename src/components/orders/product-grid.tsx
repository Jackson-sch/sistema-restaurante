'use client';

import { ProductWithRelations, CartItemInput } from './order-interface';
import { ProductCard } from './product-card';
import { Package } from 'lucide-react';

interface ProductGridProps {
    products: ProductWithRelations[];
    onAddToCart: (item: CartItemInput) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center mb-6">
                    <Package className="h-16 w-16 text-muted-foreground/40" />
                </div>
                <p className="text-lg font-semibold">No hay productos en esta categoría</p>
                <p className="text-sm mt-1">Selecciona otra categoría para ver los productos disponibles</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 animate-in fade-in duration-300">
            {products.map((product, index) => (
                <div
                    key={product.id}
                    className="animate-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                    <ProductCard
                        product={product}
                        onAddToCart={onAddToCart}
                    />
                </div>
            ))}
        </div>
    );
}
