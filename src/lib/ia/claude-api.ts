// Provedor de IA via API HTTP da Anthropic (fetch direto, sem SDK). Roda só no servidor:
// a chave vem de process.env e nunca é enviada ao navegador nem escrita em logs/erros.
import type { OpcoesIA, ProvedorIA } from "@/lib/ia/provedor"

const URL_API = "https://api.anthropic.com/v1/messages"
const VERSAO_API = "2023-06-01"
const MODELO_PADRAO = "claude-sonnet-5-5"
const MAX_TOKENS_PADRAO = 8192
const TEMPO_LIMITE_PADRAO_MS = 2 * 60 * 1000

interface ConfigApi {
  env?: NodeJS.ProcessEnv
  /** Injetável para testes (nunca fazer rede real nos testes). */
  fetchImpl?: typeof fetch
}

function inteiroPositivo(valor: string | undefined, padrao: number): number {
  const n = Number.parseInt(valor ?? "", 10)
  return Number.isFinite(n) && n > 0 ? n : padrao
}

export function criarProvedorApi({ env = process.env, fetchImpl }: ConfigApi = {}): ProvedorIA {
  return {
    async gerar(contexto: string, instrucoes: string, opcoes: OpcoesIA = {}): Promise<string> {
      const chave = env.ANTHROPIC_API_KEY?.trim()
      if (!chave) {
        throw new Error("Falta a chave da IA: defina ANTHROPIC_API_KEY no .env.local e reinicie o app.")
      }
      const tempoLimiteMs = opcoes.tempoLimiteMs ?? TEMPO_LIMITE_PADRAO_MS
      const maxTokens = opcoes.maxTokens ?? inteiroPositivo(env.BUSINESSOS_IA_MAX_TOKENS, MAX_TOKENS_PADRAO)
      const modelo = env.BUSINESSOS_IA_MODELO?.trim() || MODELO_PADRAO

      const controle = new AbortController()
      const timer = setTimeout(() => controle.abort(), tempoLimiteMs)
      let resposta: Response
      try {
        resposta = await (fetchImpl ?? fetch)(URL_API, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": chave,
            "anthropic-version": VERSAO_API,
          },
          body: JSON.stringify({
            model: modelo,
            max_tokens: maxTokens,
            system: instrucoes,
            messages: [{ role: "user", content: contexto }],
          }),
          signal: controle.signal,
        })
      } catch (e) {
        if (controle.signal.aborted) {
          throw new Error(`A IA demorou demais para responder (${Math.round(tempoLimiteMs / 1000)} s). Tente de novo.`)
        }
        throw new Error(`Não consegui falar com a API da Anthropic: ${e instanceof Error ? e.message : "erro de rede"}.`)
      } finally {
        clearTimeout(timer)
      }

      if (!resposta.ok) throw new Error(mensagemDeErro(resposta.status))

      const dados = (await resposta.json().catch(() => null)) as { content?: { type: string; text?: string }[] } | null
      const texto = (dados?.content ?? [])
        .filter((b) => b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("")
        .trim()
      if (!texto) throw new Error("A IA respondeu sem texto. Tente de novo.")
      return texto
    },
  }
}

function mensagemDeErro(status: number): string {
  if (status === 401 || status === 403) return "A chave ANTHROPIC_API_KEY foi recusada. Confira o valor no .env.local."
  if (status === 429) return "Limite de uso da API da Anthropic atingido. Aguarde um pouco e tente de novo."
  if (status >= 500) return `A API da Anthropic está instável (erro ${status}). Tente de novo em instantes.`
  return `A API da Anthropic recusou o pedido (erro ${status}).`
}
