"use client"

// Quadro Kanban: uma coluna por status; cada cartão mostra o agente e os documentos.
// Arrastar um cartão para outra coluna muda o status da tarefa (ou use a alça com o teclado).
// Mobile: colunas lado a lado com rolagem horizontal; a partir de lg, as 4 colunas ocupam a largura.
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { CartaoArrastavel, ColunaSoltavel, ContextoKanban } from "@/components/kanban/arrastar"
import { AvatarAgente } from "@/components/agentes/avatar-agente"
import { Badge } from "@/components/ui/badge"
import { formatarDataHora } from "@/lib/format"
import { hrefDoDocumento, obterPagina } from "@/lib/content/navigation"
import { ROTULOS_STATUS_TAREFA, STATUS_TAREFA, type StatusTarefa, type Tarefa } from "@/lib/workflow/tipos"

import { moverTarefaAction } from "./actions"

const CLASSE_CARTAO = "space-y-2 rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10"

/** Conteúdo do cartão (o mesmo no quadro e na sobreposição enquanto arrasta). */
function ConteudoTarefa({ tarefa, apelido }: { tarefa: Tarefa; apelido: string }) {
  return (
    <>
      <p className="pr-6 font-medium leading-snug">{tarefa.titulo}</p>
      {tarefa.nota && <p className="text-xs text-muted-foreground">{tarefa.nota}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="gap-1.5 pl-0.5 text-[11px]">
          <AvatarAgente nome={tarefa.agente} tamanho={18} />
          {apelido}
        </Badge>
        {tarefa.docs.map((id) => {
          const { secao, pagina } = obterPagina(id)
          return (
            <Link
              key={id}
              href={hrefDoDocumento(id)}
              className="rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {secao.nome} · {pagina.titulo}
            </Link>
          )
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        <time dateTime={tarefa.atualizado_em}>{formatarDataHora(tarefa.atualizado_em)}</time>
      </p>
    </>
  )
}

/** `apelidos`: nome técnico do agente → nome de exibição (agente sem arquivo usa o nome técnico). */
export function Quadro({
  tarefas: tarefasDoServidor,
  apelidos,
}: {
  tarefas: Tarefa[]
  apelidos: Record<string, string>
}) {
  const router = useRouter()
  // Cópia local: o cartão muda de coluna na hora e o servidor confirma em seguida
  const [tarefas, setTarefas] = React.useState(tarefasDoServidor)
  const [versaoVista, setVersaoVista] = React.useState(tarefasDoServidor)
  if (tarefasDoServidor !== versaoVista) {
    setVersaoVista(tarefasDoServidor)
    setTarefas(tarefasDoServidor)
  }

  const mover = (id: string, destino: string) => {
    const novoStatus = STATUS_TAREFA.find((s) => s === destino)
    const tarefa = tarefas.find((t) => t.id === id)
    if (!novoStatus || !tarefa || tarefa.status === novoStatus) return
    const anteriores = tarefas
    setTarefas((atuais) =>
      atuais.map((t) => (t.id === id ? { ...t, status: novoStatus, atualizado_em: new Date().toISOString() } : t)),
    )
    void moverTarefaAction({ id, status: novoStatus }).then((r) => {
      if (!r.ok) {
        setTarefas(anteriores)
        toast.error(r.mensagem)
        return
      }
      router.refresh()
    })
  }

  // Mais recente primeiro dentro de cada coluna
  const porStatus = (s: StatusTarefa) =>
    tarefas.filter((t) => t.status === s).sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em))

  return (
    <ContextoKanban
      aoMover={mover}
      sobreposicao={(id) => {
        const t = tarefas.find((x) => x.id === id)
        return t ? <div className={CLASSE_CARTAO}><ConteudoTarefa tarefa={t} apelido={apelidos[t.agente] ?? t.agente} /></div> : null
      }}
    >
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {STATUS_TAREFA.map((status) => {
          const lista = porStatus(status)
          return (
            <ColunaSoltavel
              key={status}
              id={status}
              aria-labelledby={`coluna-${status}`}
              className="w-[82vw] max-w-sm shrink-0 snap-start space-y-3 rounded-xl bg-muted/40 p-3 lg:w-auto lg:max-w-none"
            >
              <header className="flex items-center justify-between">
                <h2 id={`coluna-${status}`} className="text-sm font-medium">
                  {ROTULOS_STATUS_TAREFA[status]}
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">{lista.length}</span>
              </header>
              {lista.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Vazio</p>
              ) : (
                <ul className="space-y-2">
                  {lista.map((t) => (
                    <CartaoArrastavel key={t.id} id={t.id} rotulo={t.titulo} className={CLASSE_CARTAO}>
                      <ConteudoTarefa tarefa={t} apelido={apelidos[t.agente] ?? t.agente} />
                    </CartaoArrastavel>
                  ))}
                </ul>
              )}
            </ColunaSoltavel>
          )
        })}
      </div>
    </ContextoKanban>
  )
}
