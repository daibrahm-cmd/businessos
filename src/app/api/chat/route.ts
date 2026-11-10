// POST /api/chat — uma rodada do chat com a IA. Resposta em NDJSON (um EventoChat por linha).
import { after } from "next/server"
import { z } from "zod"
import { buscarContexto, indexarMensagem } from "@/lib/conhecimento"
import { repositorioDoUsuario } from "@/lib/conversas/acesso"
import { executarRodada } from "@/lib/conversas/chat"
import type { EventoChat } from "@/lib/conversas/tipos"
import { transmitirResposta } from "@/lib/ia/claude-api"
import { perfilAtual } from "@/lib/supabase/perfil"

export const dynamic = "force-dynamic"

const PERGUNTA_MAX = 4000

const corpoSchema = z.object({
  conversaId: z.string().uuid().optional(),
  pergunta: z.string().trim().min(1, "Escreva uma pergunta.").max(PERGUNTA_MAX, `A pergunta pode ter até ${PERGUNTA_MAX} caracteres.`),
})

const linha = (e: EventoChat) => `${JSON.stringify(e)}\n`

/** Erros antes do stream também seguem o contrato: uma linha `erro`, com o status HTTP correspondente. */
function respostaErro(mensagem: string, status: number): Response {
  return new Response(linha({ tipo: "erro", mensagem }), {
    status,
    headers: { "content-type": "application/x-ndjson; charset=utf-8" },
  })
}

export async function POST(req: Request): Promise<Response> {
  const perfil = await perfilAtual().catch(() => null)
  if (!perfil) return respostaErro("Sessão expirada. Faça login de novo.", 401)

  const json: unknown = await req.json().catch(() => null)
  const corpo = corpoSchema.safeParse(json)
  if (!corpo.success) return respostaErro(corpo.error.issues[0]?.message ?? "Pedido inválido.", 400)

  let repo
  try {
    repo = await repositorioDoUsuario(perfil.id)
  } catch (e) {
    console.error("[api/chat]", e)
    return respostaErro("Não foi possível concluir. Tente de novo.", 500)
  }

  const codificador = new TextEncoder()
  const rodada = executarRodada(corpo.data, {
    repo,
    conhecimento: { buscarContexto, indexarMensagem },
    transmitir: (mensagens, instrucoes) => transmitirResposta(mensagens, instrucoes, { signal: req.signal }),
    // Indexação continua depois de a resposta fechar; sem contexto de requisição, só dispara.
    agendar: (tarefa) => {
      try {
        after(() => tarefa)
      } catch {
        void tarefa.catch(() => {})
      }
    },
  })

  const stream = new ReadableStream<Uint8Array>({
    async pull(controle) {
      const { done, value } = await rodada.next()
      if (done) controle.close()
      else controle.enqueue(codificador.encode(linha(value)))
    },
    cancel() {
      return rodada.return(undefined).then(() => undefined)
    },
  })

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  })
}
