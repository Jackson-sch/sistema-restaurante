"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash, Search, Save, Loader2, Check } from "lucide-react"
import { getIngredients, getRecipe, updateRecipe } from "@/actions/inventory"
import { toast } from "sonner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface Ingredient {
  id: string
  name: string
  unit: string
  cost: any
}

interface RecipeItem {
  ingredientId: string
  ingredientName: string
  unit: string
  quantity: number
  cost: number
  variantId?: string | null
}

interface RecipeManagerProps {
  productId: string
  variants: any[]
}

export function RecipeManager({ productId, variants }: RecipeManagerProps) {
  const [items, setItems] = useState<RecipeItem[]>([])
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, startTransition] = useTransition()
  const [openCombobox, setOpenCombobox] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<string>("base")

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [recipeResult, ingredientsResult] = await Promise.all([
          getRecipe(productId),
          getIngredients()
        ])

        if (ingredientsResult.success && ingredientsResult.data) {
          setAvailableIngredients(ingredientsResult.data)
        }

        if (recipeResult.success && recipeResult.data) {
          const mappedItems = recipeResult.data.map((item: any) => ({
            ingredientId: item.ingredientId,
            ingredientName: item.ingredient.name,
            unit: item.ingredient.unit,
            quantity: Number(item.quantity),
            cost: Number(item.ingredient.cost),
            variantId: item.variantId
          }))
          setItems(mappedItems)
        }
      } catch (error) {
        toast.error("Error al cargar datos de la receta")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [productId])

  const handleAddItem = (ingredient: Ingredient) => {
    const targetVariantId = selectedVariantId === "base" ? null : selectedVariantId

    if (items.some(item => item.ingredientId === ingredient.id && item.variantId === targetVariantId)) {
      toast.error("El ingrediente ya está en la receta para esta variante")
      return
    }

    setItems([
      ...items,
      {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        unit: ingredient.unit,
        quantity: 1,
        cost: Number(ingredient.cost),
        variantId: targetVariantId
      }
    ])
    setOpenCombobox(false)
  }

  const handleRemoveItem = (ingredientId: string, variantId?: string | null) => {
    setItems(items.filter(item => !(item.ingredientId === ingredientId && item.variantId === variantId)))
  }

  const handleQuantityChange = (ingredientId: string, variantId: string | null | undefined, quantity: number) => {
    setItems(items.map(item =>
      item.ingredientId === ingredientId && item.variantId === variantId
        ? { ...item, quantity }
        : item
    ))
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateRecipe(
        productId,
        items.map(item => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          variantId: item.variantId
        }))
      )

      if (result.success) {
        toast.success("Receta guardada correctamente")
      } else {
        toast.error(result.error)
      }
    })
  }

  const filteredItems = items.filter(item => {
    if (selectedVariantId === "base") return !item.variantId
    return item.variantId === selectedVariantId || !item.variantId
  })

  const totalCost = filteredItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0)

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <select
            className="w-full max-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
          >
            <option value="base">Receta Base (General)</option>
            {variants.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          Costo Total: <span className="font-bold text-foreground">S/ {totalCost.toFixed(2)}</span>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Guardar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingrediente</TableHead>
              <TableHead className="w-[150px]">Cantidad</TableHead>
              <TableHead className="w-[100px]">Unidad</TableHead>
              <TableHead className="text-right">Costo Est.</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No hay ingredientes para esta selección.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={`${item.ingredientId}-${item.variantId || 'base'}`}>
                  <TableCell className="font-medium">
                    {item.ingredientName}
                    {item.variantId && <span className="ml-2 text-xs text-blue-500">(Variante)</span>}
                    {!item.variantId && selectedVariantId !== "base" && <span className="ml-2 text-xs text-gray-500">(Base)</span>}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.ingredientId, item.variantId, parseFloat(e.target.value) || 0)}
                      className="h-8 w-24"
                      disabled={!item.variantId && selectedVariantId !== "base"} // Disable base items when viewing variant
                    />
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">
                    S/ {(item.quantity * item.cost).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {(!item.variantId && selectedVariantId === "base") || (item.variantId === selectedVariantId) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.ingredientId, item.variantId)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow>
              <TableCell colSpan={5} className="p-2">
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-muted-foreground border-dashed">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Ingrediente
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar ingrediente..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron ingredientes.</CommandEmpty>
                        <CommandGroup>
                          {availableIngredients.map((ingredient) => (
                            <CommandItem
                              key={ingredient.id}
                              value={ingredient.name}
                              onSelect={() => handleAddItem(ingredient)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  items.some(i => i.ingredientId === ingredient.id && i.variantId === (selectedVariantId === "base" ? null : selectedVariantId)) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {ingredient.name} ({ingredient.unit})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
