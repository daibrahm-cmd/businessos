"use client"

// Seletor compacto "Grade / Lista" usado no cabeçalho de toda coleção de cards.
import { LayoutGrid, List } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ModoVisualizacao } from "@/lib/content/types"
import { cn } from "@/lib/utils"

export interface ViewModeSelectProps {
  value: ModoVisualizacao
  onValueChange: (m: ModoVisualizacao) => void
  className?: string
}

export function ViewModeSelect({ value, onValueChange, className }: ViewModeSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as ModoVisualizacao)}>
      <SelectTrigger
        aria-label="Modo de visualização"
        className={cn("h-11 w-[120px] md:h-8", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="grade" className="min-h-11 md:min-h-8">
          <LayoutGrid aria-hidden />
          Grade
        </SelectItem>
        <SelectItem value="lista" className="min-h-11 md:min-h-8">
          <List aria-hidden />
          Lista
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
