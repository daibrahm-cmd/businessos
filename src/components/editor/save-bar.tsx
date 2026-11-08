"use client"

// Barra flutuante de salvamento: aparece quando há alterações não salvas no rascunho da página.
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export interface SaveBarProps {
  visivel: boolean
  salvando: boolean
  /** Número de alterações pendentes. */
  quantidade: number
  onSalvar: () => void
  onDescartar: () => void
  /** Substitui o texto padrão ("N alterações não salvas"). */
  mensagem?: string
}

function textoPadrao(quantidade: number): string {
  return quantidade === 1 ? "1 alteração não salva" : `${quantidade} alterações não salvas`
}

export function SaveBar({ visivel, salvando, quantidade, onSalvar, onDescartar, mensagem }: SaveBarProps) {
  return (
    // A região aria-live fica sempre no DOM para leitores de tela anunciarem a mudança
    <div aria-live="polite" className="pointer-events-none sticky bottom-4 z-20 flex justify-center">
      {visivel && (
        <div
          role="region"
          aria-label="Alterações não salvas"
          className="pointer-events-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border bg-popover px-4 py-3 text-popover-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2"
        >
          <p className="min-w-0 text-sm">
            <span className="font-medium">{salvando ? "Salvando…" : (mensagem ?? textoPadrao(quantidade))}</span>
            <kbd className="ml-2 hidden font-sans text-xs text-muted-foreground md:inline">⌘S / Ctrl+S</kbd>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" onClick={onDescartar} disabled={salvando} className="h-11 md:h-8">
              Descartar
            </Button>
            <Button onClick={onSalvar} disabled={salvando} aria-busy={salvando} className="h-11 md:h-8">
              {salvando && <Loader2 data-icon="inline-start" aria-hidden className="animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
