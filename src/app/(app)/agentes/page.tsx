// Agentes: quem são, o que leem e escrevem e se estão trabalhando agora (definidos em agents/*.md).
import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"
import { CabecalhoPagina } from "@/components/relatorio/cabecalho-pagina"
import { Bloco } from "@/components/relatorio/pecas"
import { listarAgentesCompletos, situacaoDosAgentes } from "@/lib/workflow/agentes"
import { ErroWorkflow, lerTarefas } from "@/lib/workflow/repositorio"
import type { Tarefa } from "@/lib/workflow/tipos"

import { ListaAgentes } from "./lista-agentes"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Agentes" }

export default async function AgentesPage() {
  const agentes = await listarAgentesCompletos()
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
            <ListaAgentes agentes={situacao} />
          )}
        </Bloco>
      </div>
    </>
  )
}
