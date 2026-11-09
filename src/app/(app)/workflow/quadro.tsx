// Quadro Kanban (somente leitura): uma coluna por status; cada cartão mostra o agente e os documentos.
// Mobile: colunas lado a lado com rolagem horizontal; a partir de lg, as 4 colunas ocupam a largura.
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { formatarDataHora } from "@/lib/format"
import { hrefDoDocumento, obterPagina } from "@/lib/content/navigation"
import { ROTULOS_STATUS_TAREFA, STATUS_TAREFA, type StatusTarefa, type Tarefa } from "@/lib/workflow/tipos"

function CartaoTarefa({ tarefa }: { tarefa: Tarefa }) {
  return (
    <li className="space-y-2 rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">
      <p className="font-medium leading-snug">{tarefa.titulo}</p>
      {tarefa.nota && <p className="text-xs text-muted-foreground">{tarefa.nota}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="font-mono text-[11px]">
          {tarefa.agente}
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
    </li>
  )
}

export function Quadro({ tarefas }: { tarefas: Tarefa[] }) {
  // Mais recente primeiro dentro de cada coluna
  const porStatus = (s: StatusTarefa) =>
    tarefas.filter((t) => t.status === s).sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em))

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
      {STATUS_TAREFA.map((status) => {
        const lista = porStatus(status)
        return (
          <section
            key={status}
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
                  <CartaoTarefa key={t.id} tarefa={t} />
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
