"use client"

// Lista de atalhos sob o prompt (ícone + texto). Cada linha preenche o prompt.
import { cn } from "@/lib/utils"

import { ATALHOS, type Atalho } from "./atalhos"

export interface AtalhosSugeridosProps {
  onEscolher: (atalho: Atalho) => void
  atalhos?: readonly Atalho[]
  className?: string
}

export function AtalhosSugeridos({ onEscolher, atalhos = ATALHOS, className }: AtalhosSugeridosProps) {
  return (
    <ul aria-label="Sugestões" className={cn("divide-y divide-border/60", className)}>
      {atalhos.map((atalho) => (
        <li key={atalho.rotulo}>
          <button
            type="button"
            onClick={() => onEscolher(atalho)}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <atalho.icone aria-hidden className="size-4 shrink-0" />
            {atalho.rotulo}
          </button>
        </li>
      ))}
    </ul>
  )
}
