// Provedor de IA via API HTTP da Anthropic (fetch direto, sem SDK). Roda só no servidor:
// a chave vem de process.env e nunca é enviada ao navegador nem escrita em logs/erros.
import { obterProvedorIA, resolverModoIA, type OpcoesIA, type ProvedorIA } from "@/lib/ia/provedor"

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

/** Uma mensagem do histórico enviado à IA. */
export interface MensagemIA {
  papel: "user" | "assistant"
  conteudo: string
}

export interface OpcoesTransmissao extends OpcoesIA {
  /** Cancelamento externo (ex.: o navegador fechou a conexão). */
  signal?: AbortSignal
}

/** Lê a chave e os limites do ambiente; a chave nunca sai daqui para mensagens de erro. */
function configurar(env: NodeJS.ProcessEnv, opcoes: OpcoesIA) {
  const chave = env.ANTHROPIC_API_KEY?.trim()
  if (!chave) throw new Error("Falta a chave da IA: defina ANTHROPIC_API_KEY no .env.local e reinicie o app.")
  return {
    chave,
    tempoLimiteMs: opcoes.tempoLimiteMs ?? TEMPO_LIMITE_PADRAO_MS,
    maxTokens: opcoes.maxTokens ?? inteiroPositivo(env.BUSINESSOS_IA_MAX_TOKENS, MAX_TOKENS_PADRAO),
    modelo: env.BUSINESSOS_IA_MODELO?.trim() || MODELO_PADRAO,
  }
}

/** Interpreta o corpo SSE da Messages API e emite só os pedaços de texto (`content_block_delta`/`text_delta`). */
async function* lerDeltasSse(corpo: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const leitor = corpo.getReader()
  const decodificador = new TextDecoder()
  let buffer = ""

  // Processa um evento SSE completo (linhas "event:"/"data:"); devolve o texto, se houver.
  const processar = (bloco: string): string | null => {
    const dados = bloco
      .split("\n")
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trimStart())
      .join("\n")
    if (!dados) return null
    let evento: { type?: string; delta?: { type?: string; text?: string } }
    try {
      evento = JSON.parse(dados)
    } catch {
      return null // linha de keep-alive ou lixo: ignora
    }
    if (evento.type === "error") throw new Error("A API da Anthropic interrompeu a resposta. Tente de novo.")
    if (evento.type === "content_block_delta" && evento.delta?.type === "text_delta" && evento.delta.text) {
      return evento.delta.text
    }
    return null
  }

  try {
    while (true) {
      const { done, value } = await leitor.read()
      if (done) break
      buffer += decodificador.decode(value, { stream: true }).replace(/\r\n/g, "\n")
      let corte: number
      while ((corte = buffer.indexOf("\n\n")) >= 0) {
        const texto = processar(buffer.slice(0, corte))
        buffer = buffer.slice(corte + 2)
        if (texto) yield texto
      }
    }
    const resto = processar(buffer + decodificador.decode())
    if (resto) yield resto
  } finally {
    leitor.cancel().catch(() => {})
  }
}

/** Transmite a resposta da API da Anthropic (`stream: true`) como pedaços de texto. */
export async function* transmitirApi(
  mensagens: MensagemIA[],
  instrucoes: string,
  { env = process.env, fetchImpl, ...opcoes }: ConfigApi & OpcoesTransmissao = {},
): AsyncGenerator<string> {
  const { chave, tempoLimiteMs, maxTokens, modelo } = configurar(env, opcoes)
  const controle = new AbortController()
  const aoCancelar = () => controle.abort()
  opcoes.signal?.addEventListener("abort", aoCancelar)
  const timer = setTimeout(() => controle.abort(), tempoLimiteMs)
  const mensagemTempo = `A IA demorou demais para responder (${Math.round(tempoLimiteMs / 1000)} s). Tente de novo.`
  try {
    let resposta: Response
    try {
      resposta = await (fetchImpl ?? fetch)(URL_API, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": chave, "anthropic-version": VERSAO_API },
        body: JSON.stringify({
          model: modelo,
          max_tokens: maxTokens,
          system: instrucoes,
          stream: true,
          messages: mensagens.map((m) => ({ role: m.papel, content: m.conteudo })),
        }),
        signal: controle.signal,
      })
    } catch (e) {
      if (controle.signal.aborted) throw new Error(mensagemTempo)
      throw new Error(`Não consegui falar com a API da Anthropic: ${e instanceof Error ? e.message : "erro de rede"}.`)
    }
    if (!resposta.ok) throw new Error(mensagemDeErro(resposta.status))
    if (!resposta.body) throw new Error("A IA respondeu sem texto. Tente de novo.")
    try {
      yield* lerDeltasSse(resposta.body)
    } catch (e) {
      if (controle.signal.aborted && !opcoes.signal?.aborted) throw new Error(mensagemTempo)
      throw e
    }
  } finally {
    clearTimeout(timer)
    opcoes.signal?.removeEventListener("abort", aoCancelar)
  }
}

/** Achata o histórico em texto para provedores que só aceitam uma entrada (CLI). */
function achatarHistorico(mensagens: MensagemIA[]): string {
  return mensagens.map((m) => `${m.papel === "user" ? "Usuária" : "Assistente"}: ${m.conteudo}`).join("\n\n")
}

/**
 * Streaming respeitando BUSINESSOS_IA: no modo `api` emite deltas reais; em `cli`/`desligada`
 * gera tudo de uma vez pelo provedor escolhido (a `desligada` falha com mensagem clara) e emite um único delta.
 */
export async function* transmitirResposta(
  mensagens: MensagemIA[],
  instrucoes: string,
  config: ConfigApi & OpcoesTransmissao = {},
): AsyncGenerator<string> {
  const env = config.env ?? process.env
  if (resolverModoIA(env) === "api") {
    yield* transmitirApi(mensagens, instrucoes, config)
    return
  }
  const texto = await obterProvedorIA(env).gerar(achatarHistorico(mensagens), instrucoes, {
    tempoLimiteMs: config.tempoLimiteMs,
    maxTokens: config.maxTokens,
  })
  yield texto
}
