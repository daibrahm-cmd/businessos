"use client"

// Botão do header que abre a lista de conversas no mobile/tablet (a coluna fixa só existe a partir de lg).
import { MessagesSquare } from "lucide-react"

import { useConversas } from "./conversas-provider"

export function BotaoConversas() {
  const { definirPainelAberto } = useConversas()
  return (
    <button
      type="button"
      onClick={() => definirPainelAberto(true)}
      aria-label="Abrir conversas"
      className="grid size-11 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
    >
      <MessagesSquare aria-hidden className="size-4" />
    </button>
  )
}
