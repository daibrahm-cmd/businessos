// Agentes: quem são, o que leem e escrevem e se estão trabalhando agora (definidos em agents/*.md).
import type { Metadata } from "next"
import Link from "next/link"

import { AppHeader } from "@/components/layout/app-header"
import { CabecalhoPagina } from "@/components/relatorio/cabecalho-pagina"
import { Bloco, CARD, ROTULO } from "@/components/relatorio/pecas"
import { Badge } from "@/components/ui/badge"
import { hrefDoDocumento, obterPagina, type DocId } from "@/lib/content/navigation"
import { listarAgentes, situacaoDosAgentes } from "@/lib/workflow/agentes"
import { ErroWorkflow, lerTarefas } from "@/lib/workflow/repositorio"
import type { Tarefa } from "@/lib/workflow/tipos"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Agentes" }

/** Lista de páginas como links curtos (ex.: "Oferta · Direção"). */
function Documentos({ rotulo, ids }: { rotulo: string; ids: readonly DocId[] }) {
  return (
    <div className="space-y-1.5">
      <p className={ROTULO}>{rotulo}</p>
      {ids.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhuma (só lê)</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {ids.map((id) => {
            const { secao, pagina } = obterPagina(id)
            return (
              <li key={id}>
                <Link
                  href={hrefDoDocumento(id)}
                  className="inline-block rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {pagina.titulo} · {secao.nome}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default async function AgentesPage() {
  const agentes = await listarAgentes()
  // Sem o arquivo do Workflow (ou inválido), os agentes aparecem como ociosos
  let tarefas: Tarefa[] = []
  try {
    tarefas = await lerTarefas()
  } catch (erro) {
    if (!(erro instanceof ErroWorkflow)) throw erro
  }
  const situacao = situacaoDosAgentes(agentes, tarefas)
  const ativos = situacao.filter((a) => a.emAndamento.length > 0).length

  return (
    <>
      <AppHeader trilha={[{ rotulo: "Agentes" }]} />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-10">
        <CabecalhoPagina
          eyebrow="Sistema"
          titulo="Agentes"
          descricao={`${agentes.length} agentes definidos em agents/. ${
            ativos === 0 ? "Nenhum trabalhando agora." : `${ativos} trabalhando agora.`
          }`}
        />

        <Bloco etiqueta="Equipe" detalhe={`${agentes.length} agentes`}>
          {agentes.length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground italic">
              Nenhum agente encontrado em agents/.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {situacao.map((a) => {
                const ativo = a.emAndamento.length > 0
                return (
                  <article key={a.nome} className={cn(CARD, "space-y-4")}>
                    <header className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="font-mono text-[11px]">
                          {a.nome}
                        </Badge>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            aria-hidden
                            className={cn(
                              "size-2 rounded-full",
                              ativo ? "animate-pulse bg-primary" : "border border-foreground/50",
                            )}
                          />
                          {ativo ? "Trabalhando" : "Ocioso"}
                        </span>
                      </div>
                      <h3 className="text-lg leading-snug font-semibold">{a.papel}</h3>
                      <p className="text-sm text-muted-foreground">{a.descricao}</p>
                    </header>
                    {ativo && (
                      <p className="rounded-lg bg-muted px-3 py-2 text-sm">{a.emAndamento.map((t) => t.titulo).join(" · ")}</p>
                    )}
                    <div className="space-y-3 border-t pt-3">
                      <Documentos rotulo="Lê" ids={a.le} />
                      <Documentos rotulo="Escreve" ids={a.escreve} />
                      {a.skills.length > 0 && (
                        <div className="space-y-1.5">
                          <p className={ROTULO}>Skills</p>
                          <p className="font-mono text-xs text-muted-foreground">{a.skills.join(" · ")}</p>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </Bloco>
      </div>
    </>
  )
}
