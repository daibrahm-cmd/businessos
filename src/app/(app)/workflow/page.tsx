// Workflow: quais agentes estão trabalhando e em quê, em formato Kanban.
import type { Metadata } from "next"

import { AvatarAgente } from "@/components/agentes/avatar-agente"
import { AppHeader } from "@/components/layout/app-header"
import { CabecalhoPagina } from "@/components/relatorio/cabecalho-pagina"
import { listarAgentes, situacaoDosAgentes } from "@/lib/workflow/agentes"
import { ErroWorkflow, lerTarefas } from "@/lib/workflow/repositorio"
import type { Tarefa } from "@/lib/workflow/tipos"

import { PainelErroConteudo } from "../_componentes/painel-erro-conteudo"
import { AtualizarAuto } from "./atualizar-auto"
import { Quadro } from "./quadro"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Workflow" }

/** Tarefas inválidas no arquivo viram painel de erro em vez de quebrar a página. */
async function carregar(): Promise<{ tarefas: Tarefa[] } | { erro: string }> {
  try {
    return { tarefas: await lerTarefas() }
  } catch (erro) {
    if (erro instanceof ErroWorkflow) return { erro: erro.message }
    throw erro
  }
}

export default async function WorkflowPage() {
  const [resultado, agentes] = await Promise.all([carregar(), listarAgentes()])
  const tarefas = "tarefas" in resultado ? resultado.tarefas : []
  const situacao = situacaoDosAgentes(agentes, tarefas)
  const trabalhando = situacao.filter((a) => a.emAndamento.length > 0)

  return (
    <>
      <AppHeader trilha={[{ rotulo: "Workflow" }]} />
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <CabecalhoPagina
            eyebrow="Agentes"
            titulo="Workflow"
            descricao={
              trabalhando.length === 0
                ? "Nenhum agente trabalhando agora."
                : `${trabalhando.length} de ${agentes.length} agentes trabalhando agora.`
            }
          />
          <AtualizarAuto />
        </div>

        {"erro" in resultado ? (
          <PainelErroConteudo titulo="O arquivo do Workflow está inválido." mensagem={resultado.erro} />
        ) : (
          <>
            {/* Quem está fazendo o quê: um chip por agente */}
            <section aria-label="Agentes" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {situacao.map((a) => {
                const ativo = a.emAndamento.length > 0
                return (
                  <div key={a.nome} className="flex items-start gap-3 rounded-lg p-3 text-sm ring-1 ring-foreground/10">
                    <AvatarAgente nome={a.nome} tamanho={36} className={ativo ? "ring-2 ring-primary" : undefined} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{a.apelido ?? a.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.papel}</p>
                      <p className="mt-1 text-sm">
                        {ativo ? a.emAndamento.map((t) => t.titulo).join(" · ") : <span className="text-muted-foreground">Ocioso</span>}
                      </p>
                      {(a.naFila > 0 || a.emRevisao > 0) && (
                        <p className="text-[11px] text-muted-foreground">
                          {a.naFila > 0 && `${a.naFila} na fila`}
                          {a.naFila > 0 && a.emRevisao > 0 && " · "}
                          {a.emRevisao > 0 && `${a.emRevisao} em revisão`}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </section>

            {tarefas.length === 0 && (
              <div className="space-y-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <p>
                  Ainda não há tarefas. Os agentes aparecem aqui quando registram o que estão fazendo, por exemplo:
                </p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">{`curl -X POST http://127.0.0.1:3000/api/workflow \\
  -H "Content-Type: application/json" \\
  -d '{"agente":"perfil-de-cliente-ideal","titulo":"Descrever o cliente ideal","status":"trabalhando","docs":["direcao/perfil-de-cliente-ideal"]}'`}</pre>
              </div>
            )}

            <Quadro tarefas={tarefas} apelidos={Object.fromEntries(agentes.map((a) => [a.nome, a.apelido ?? a.nome]))} />
          </>
        )}
      </div>
    </>
  )
}
