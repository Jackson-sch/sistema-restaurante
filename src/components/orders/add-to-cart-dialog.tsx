'use client';

import { useState, useEffect } from 'react';
import type { ProductWithRelations, CartItemInput } from '@/components/orders/order-interface';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import { Minus, Plus, ChefHat } from 'lucide-react';
import { Modifier } from '@prisma/client';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";

interface AddToCartDialogProps {
    product: ProductWithRelations;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddToCart: (item: CartItemInput) => void;
}

export function AddToCartDialog({ product, open, onOpenChange, onAddToCart }: AddToCartDialogProps) {
    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
        product.variants.length > 0 ? product.variants[0].id : undefined
    );
    const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedVariantId(product.variants.length > 0 ? product.variants[0].id : undefined);
            setSelectedModifiers({});
            setQuantity(1);
            setNotes('');
        }
    }, [open, product]);

    const handleModifierChange = (groupId: string, modifierId: string, isMulti: boolean) => {
        setSelectedModifiers(prev => {
            const current = prev[groupId] || [];
            if (isMulti) {
                if (current.includes(modifierId)) {
                    return { ...prev, [groupId]: current.filter(id => id !== modifierId) };
                } else {
                    return { ...prev, [groupId]: [...current, modifierId] };
                }
            } else {
                return { ...prev, [groupId]: [modifierId] };
            }
        });
    };

    const quickNotes = [
        "Sin sal", "Bajo en sal", "Sin picante", "Picante aparte",
        "Sin cebolla", "Salsas aparte", "Bien cocido", "Término medio"
    ];

    const addQuickNote = (note: string) => {
        if (notes.includes(note)) return;
        setNotes(prev => prev ? `${prev}, ${note}` : note);
    };

    const calculateTotal = () => {
        let total = Number(product.price);

        if (selectedVariantId) {
            const variant = product.variants.find(v => v.id === selectedVariantId);
            if (variant) {
                total = Number(variant.price);
            }
        }

        Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
            const group = product.modifierGroups.find(g => g.modifierGroupId === groupId);
            if (group) {
                modifierIds.forEach(modId => {
                    const mod = group.modifierGroup.modifiers.find(m => m.id === modId);
                    if (mod) {
                        total += Number(mod.price);
                    }
                });
            }
        });

        return total * quantity;
    };

    const handleAddToCart = () => {
        // Validation: Check required modifier groups
        const missingRequiredGroups = product.modifierGroups.filter(group =>
            group.modifierGroup.required &&
            (!selectedModifiers[group.modifierGroupId] || selectedModifiers[group.modifierGroupId].length === 0)
        );

        if (missingRequiredGroups.length > 0) {
            const groupNames = missingRequiredGroups.map(g => g.modifierGroup.name).join(", ");
            toast.error(`Por favor selecciona opciones para: ${groupNames}`);
            return;
        }

        const variant = product.variants.find(v => v.id === selectedVariantId);

        const modifiers: Modifier[] = [];
        Object.entries(selectedModifiers).forEach(([groupId, modifierIds]) => {
            const group = product.modifierGroups.find(g => g.modifierGroupId === groupId);
            if (group) {
                modifierIds.forEach(modId => {
                    const mod = group.modifierGroup.modifiers.find(m => m.id === modId);
                    if (mod) modifiers.push(mod);
                });
            }
        });

        onAddToCart({
            tempId: Math.random().toString(36).substr(2, 9),
            product: product,
            variant: variant,
            modifiers: modifiers,
            quantity,
            notes
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="shrink-0 p-6 pb-0">
                    <DialogTitle>{product.name}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 min-h-0">
                    <div className="space-y-6 py-4">
                        {/* Variants */}
                        {product.variants.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-medium">Tamaño / Variedad</h4>
                                <RadioGroup value={selectedVariantId} onValueChange={setSelectedVariantId}>
                                    {product.variants.map(variant => (
                                        <div key={variant.id} className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value={variant.id} id={variant.id} />
                                                <Label htmlFor={variant.id}>{variant.name}</Label>
                                            </div>
                                            <span className="text-sm font-medium">{formatCurrency(Number(variant.price))}</span>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}

                        {/* Ingredients - Direct display for waiters */}
                        {product.recipe && product.recipe.length > 0 && (() => {
                            // Filter ingredients: show base (variantId=null) + selected variant ingredients
                            const relevantIngredients = product.recipe.filter(r =>
                                !r.variantId || r.variantId === selectedVariantId
                            );
                            if (relevantIngredients.length === 0) return null;
                            return (
                                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <ChefHat className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">¿Qué contiene?</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {relevantIngredients.map(item => item.ingredient.name).join(', ')}
                                    </p>
                                </div>
                            );
                        })()}

                        {/* Modifiers */}
                        {product.modifierGroups.map(group => (
                            <div key={group.modifierGroupId} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium">
                                        {group.modifierGroup.name}
                                        {group.modifierGroup.required && <span className="text-red-500 ml-1">*</span>}
                                    </h4>
                                    <span className="text-xs text-muted-foreground">
                                        {group.modifierGroup.multiSelect ?
                                            (group.modifierGroup.maxSelect ? `Máx ${group.modifierGroup.maxSelect}` : 'Opcional') :
                                            'Seleccione uno'}
                                    </span>
                                </div>

                                {group.modifierGroup.multiSelect ? (
                                    <div className="grid gap-2">
                                        {group.modifierGroup.modifiers.map(modifier => {
                                            const isSelected = (selectedModifiers[group.modifierGroupId] || []).includes(modifier.id);
                                            return (
                                                <div
                                                    key={modifier.id}
                                                    className="flex items-center justify-between border p-3 rounded-md cursor-pointer hover:bg-muted/50"
                                                    onClick={() => handleModifierChange(group.modifierGroupId, modifier.id, true)}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox checked={isSelected} />
                                                        <Label className="cursor-pointer">{modifier.name}</Label>
                                                    </div>
                                                    {Number(modifier.price) > 0 && (
                                                        <span className="text-sm text-muted-foreground">
                                                            +{formatCurrency(Number(modifier.price))}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <RadioGroup
                                        value={selectedModifiers[group.modifierGroupId]?.[0]}
                                        onValueChange={(val) => handleModifierChange(group.modifierGroupId, val, false)}
                                    >
                                        {group.modifierGroup.modifiers.map(modifier => (
                                            <div key={modifier.id} className="flex items-center justify-between border p-3 rounded-md hover:bg-muted/50">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value={modifier.id} id={`${group.modifierGroupId}-${modifier.id}`} />
                                                    <Label htmlFor={`${group.modifierGroupId}-${modifier.id}`} className="cursor-pointer w-full">
                                                        {modifier.name}
                                                    </Label>
                                                </div>
                                                {Number(modifier.price) > 0 && (
                                                    <span className="text-sm text-muted-foreground">
                                                        +{formatCurrency(Number(modifier.price))}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </RadioGroup>
                                )}
                            </div>
                        ))}

                        {/* Notes */}
                        <div className="space-y-3">
                            <Label htmlFor="notes">Notas adicionales</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {quickNotes.map(note => (
                                    <Badge
                                        key={note}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                        onClick={() => addQuickNote(note)}
                                    >
                                        {note}
                                    </Badge>
                                ))}
                            </div>
                            <Textarea
                                id="notes"
                                className="min-h-[80px] resize-none"
                                placeholder="Ej: Sin sal, salsas aparte..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="shrink-0 flex items-center justify-between sm:justify-between border-t p-6 pt-4">
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setQuantity(quantity + 1)}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button className="w-full sm:w-auto min-w-[200px]" onClick={handleAddToCart}>
                        Agregar - {formatCurrency(calculateTotal())}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
