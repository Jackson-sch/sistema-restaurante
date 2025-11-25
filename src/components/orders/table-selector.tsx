"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export type TableData = {
    id: string
    number: string
    capacity: number
    status: string
    zone: {
        id: string
        name: string
    } | null
}

interface TableSelectorProps {
    tables: TableData[]
    selectedTable: TableData | null
    onSelectTable: (table: TableData | null) => void
    disabled?: boolean
}

export function TableSelector({ tables, selectedTable, onSelectTable, disabled }: TableSelectorProps) {
    const [open, setOpen] = React.useState(false)

    const availableTables = tables.filter((table) => table.status === "AVAILABLE")

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between",
                            !selectedTable && "text-muted-foreground"
                        )}
                        disabled={disabled}
                    >
                        {selectedTable ? (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span className="font-medium">Mesa {selectedTable.number}</span>
                                {selectedTable.zone && (
                                    <span className="text-xs text-muted-foreground">• {selectedTable.zone.name}</span>
                                )}
                            </div>
                        ) : (
                            <span>Seleccionar mesa...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar mesa..." />
                        <CommandList>
                            <CommandEmpty>
                                {availableTables.length === 0 ? (
                                    <div className="py-6 text-center text-sm">
                                        <p className="font-medium text-muted-foreground">No hay mesas disponibles</p>
                                        <p className="text-xs text-muted-foreground mt-1">Todas las mesas están ocupadas</p>
                                    </div>
                                ) : (
                                    "No se encontraron mesas."
                                )}
                            </CommandEmpty>
                            <CommandGroup>
                                {availableTables.map((table) => (
                                    <CommandItem
                                        key={table.id}
                                        value={`${table.number}${table.zone ? ` ${table.zone.name}` : ""}`}
                                        onSelect={() => {
                                            onSelectTable(table.id === selectedTable?.id ? null : table)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedTable?.id === table.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex items-center justify-between flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">Mesa {table.number}</span>
                                                {table.zone && (
                                                    <span className="text-xs text-muted-foreground">• {table.zone.name}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                {table.capacity}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {availableTables.length > 0 && (
                <p className="text-xs text-muted-foreground">
                    {availableTables.length} {availableTables.length === 1 ? 'mesa disponible' : 'mesas disponibles'}
                </p>
            )}
        </div>
    )
}
