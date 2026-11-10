"use client"

// Segunda sidebar de /principal: fixa ao lado da sidebar principal no desktop (lg+) e em um Sheet no mobile.
import { usePathname, useRouter } from "next/navigation"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { excluirConversaAction, renomearConversaAction } from "@/lib/conversas/actions"

import { useConversas } from "./conversas-provider"
import { ListaConversas } from "./lista-conversas"

/** Extrai o id de /principal/<id>; null em /principal. */
export function idDaRota(pathname: string): string | null {
  const m = /^\/principal\/([^/]+)/.exec(pathname)
  return m ? decodeURIComponent(m[1]) : null
}

function usePainel() {
  const { conversas, erro, renomear, remover, definirPainelAberto } = useConversas()
  const pathname = usePathname()
  const router = useRouter()
  const ativaId = idDaRota(pathname)

  const onRenomear = async (id: string, titulo: string) => {
    try {
      const r = await renomearConversaAction(id, titulo)
      if (!r.ok) return r.mensagem
      renomear(id, titulo)
      return null
    } catch {
      return "Não foi possível renomear agora. Tente de novo."
    }
  }

  const onExcluir = async (id: string) => {
    try {
      const r = await excluirConversaAction(id)
      if (!r.ok) return r.mensagem
      remover(id)
      // Excluiu a conversa aberta: volta para a tela inicial
      if (id === ativaId) router.push("/principal")
      return null
    } catch {
      return "Não foi possível excluir agora. Tente de novo."
    }
  }

  return { conversas, erro, ativaId, onRenomear, onExcluir, fechar: () => definirPainelAberto(false) }
}

/** Coluna fixa (>= lg). Abaixo disso fica oculta e o Sheet assume. */
export function PainelConversasDesktop() {
  const p = usePainel()
  return (
    <aside
      aria-label="Conversas anteriores"
      className="hidden w-[280px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
    >
      <ListaConversas
        conversas={p.conversas}
        ativaId={p.ativaId}
        erro={p.erro}
        onRenomear={p.onRenomear}
        onExcluir={p.onExcluir}
      />
    </aside>
  )
}

/** Painel em gaveta (< lg), aberto pelo botão do header. */
export function PainelConversasMobile() {
  const { painelAberto, definirPainelAberto } = useConversas()
  const p = usePainel()
  return (
    <Sheet open={painelAberto} onOpenChange={definirPainelAberto}>
      <SheetContent side="left" className="w-[min(20rem,88vw)] gap-0 bg-sidebar p-0 sm:max-w-none">
        <div className="px-4 pt-4">
          <SheetTitle>Conversas</SheetTitle>
          <SheetDescription className="sr-only">Conversas anteriores e atalho para uma nova conversa.</SheetDescription>
        </div>
        <ListaConversas
          conversas={p.conversas}
          ativaId={p.ativaId}
          erro={p.erro}
          onRenomear={p.onRenomear}
          onExcluir={p.onExcluir}
          onNavegar={p.fechar}
        />
      </SheetContent>
    </Sheet>
  )
}
