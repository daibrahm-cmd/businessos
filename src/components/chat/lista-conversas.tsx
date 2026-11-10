"use client"

// Conteúdo da segunda sidebar: "Nova conversa" + conversas anteriores (cards em lista, nunca tabela).
// Componente de apresentação: quem o usa decide de onde vêm os dados e as ações.
import Link from "next/link"
import { SquarePen } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import type { ResumoConversa } from "@/lib/conversas/tipos"
import { cn } from "@/lib/utils"

import { ItemConversa, type ItemConversaProps } from "./item-conversa"

export interface ListaConversasProps extends Pick<ItemConversaProps, "onRenomear" | "onExcluir"> {
  conversas: ResumoConversa[]
  /** Id da conversa aberta agora. */
  ativaId?: string | null
  erro?: string | null
  /** Chamado ao navegar (fecha o painel no mobile). */
  onNavegar?: () => void
  className?: string
}

export function ListaConversas({
  conversas,
  ativaId,
  erro,
  onRenomear,
  onExcluir,
  onNavegar,
  className,
}: ListaConversasProps) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <div className="px-3 pt-3">
        <Link
          href="/principal"
          onClick={onNavegar}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full justify-start gap-2 text-[12px] md:h-9")}
        >
          <SquarePen aria-hidden className="size-3.5" />
          Nova conversa
        </Link>
      </div>

      <p className="px-4 text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">Conversas</p>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {erro ? (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs">
            {erro}
          </p>
        ) : conversas.length === 0 ? (
          <p className="px-1 text-xs text-muted-foreground">
            Nenhuma conversa ainda. Faça uma pergunta para começar.
          </p>
        ) : (
          <ul className="space-y-2">
            {conversas.map((c) => (
              <li key={c.id}>
                <ItemConversa
                  conversa={c}
                  ativa={c.id === ativaId}
                  onRenomear={onRenomear}
                  onExcluir={onExcluir}
                  onAbrir={onNavegar}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
