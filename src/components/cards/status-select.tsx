"use client"

// Seletor do status da página (cada opção mostra o StatusBadge correspondente).
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Status } from "@/lib/content/types"

import { ORDEM_STATUS, StatusBadge } from "./status-badge"

export interface StatusSelectProps {
  value: Status
  onValueChange: (s: Status) => void
  disabled?: boolean
}

export function StatusSelect({ value, onValueChange, disabled }: StatusSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as Status)} disabled={disabled}>
      <SelectTrigger aria-label="Status da página" className="h-11 min-w-36 md:h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDEM_STATUS.map((status) => (
          <SelectItem key={status} value={status} className="min-h-11 md:min-h-8">
            <StatusBadge status={status} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
