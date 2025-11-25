"use client"

import { Search, X } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultsCount?: number
  className?: string
}

export function SearchInput({ value, onChange, placeholder = "Buscar...", resultsCount, className }: SearchInputProps) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <Search className="size-4" />
      </InputGroupAddon>
      <InputGroupInput placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {resultsCount !== undefined && value && (
        <span className="px-2 text-xs text-muted-foreground">
          {resultsCount} resultado{resultsCount !== 1 ? "s" : ""}
        </span>
      )}
      {value && (
        <InputGroupButton variant="ghost" size="icon-xs" onClick={() => onChange("")} aria-label="Limpiar búsqueda">
          <X className="size-3.5" />
        </InputGroupButton>
      )}
    </InputGroup>
  )
}
