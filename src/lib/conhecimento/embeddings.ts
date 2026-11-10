// Embeddings pela API Generative Language do Google (fetch direto, sem SDK). Roda só no servidor:
// a chave vem de process.env e nunca aparece em logs, mensagens de erro nem no navegador.

const URL_BASE = "https://generativelanguage.googleapis.com/v1beta"
const MODELO_PADRAO = "gemini-embedding-001"
/** Tem de bater com vector(768) da migration. */
export const DIMENSOES = 768
/** Limite da API por chamada de batchEmbedContents. */
const MAX_POR_LOTE = 100
const TEMPO_LIMITE_PADRAO_MS = 30 * 1000

type TipoTarefa = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"

export interface ConfigEmbeddings {
  env?: Record<string, string | undefined>
  /** Injetável para testes (nunca fazer rede real nos testes). */
  fetchImpl?: typeof fetch
  tempoLimiteMs?: number
}

export interface ClienteEmbeddings {
  /** Vetores para indexar (taskType RETRIEVAL_DOCUMENT), na mesma ordem dos textos. */
  embedDocumentos(textos: string[]): Promise<number[][]>
  /** Vetor da pergunta (taskType RETRIEVAL_QUERY). */
  embedConsulta(texto: string): Promise<number[]>
}

/** Sem GOOGLE_API_KEY a base de conhecimento fica desligada (o chat segue funcionando). */
export function embeddingsConfigurado(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.GOOGLE_API_KEY?.trim())
}

export function criarClienteEmbeddings({ env = process.env, fetchImpl, tempoLimiteMs }: ConfigEmbeddings = {}): ClienteEmbeddings {
  const modelo = env.GOOGLE_EMBEDDING_MODELO?.trim() || MODELO_PADRAO
  const limite = tempoLimiteMs ?? TEMPO_LIMITE_PADRAO_MS

  async function lote(textos: string[], tipo: TipoTarefa): Promise<number[][]> {
    const chave = env.GOOGLE_API_KEY?.trim()
    if (!chave) throw new Error("Falta a chave do Google: defina GOOGLE_API_KEY no .env.local e reinicie o app.")

    const controle = new AbortController()
    const timer = setTimeout(() => controle.abort(), limite)
    let resposta: Response
    try {
      resposta = await (fetchImpl ?? fetch)(`${URL_BASE}/models/${modelo}:batchEmbedContents`, {
        method: "POST",
        // A chave vai no header, nunca na URL (URLs aparecem em logs e mensagens de erro).
        headers: { "content-type": "application/json", "x-goog-api-key": chave },
        body: JSON.stringify({
          requests: textos.map((texto) => ({
            model: `models/${modelo}`,
            content: { parts: [{ text: texto }] },
            taskType: tipo,
            outputDimensionality: DIMENSOES,
          })),
        }),
        signal: controle.signal,
      })
    } catch (erro) {
      if (controle.signal.aborted) throw new Error(`A API de embeddings do Google não respondeu em ${Math.round(limite / 1000)}s.`)
      // Não repassa a mensagem original: ela pode carregar a URL/cabeçalhos da requisição.
      throw new Error(`Falha de rede ao chamar a API de embeddings do Google${erro instanceof Error ? ` (${erro.name})` : ""}.`)
    } finally {
      clearTimeout(timer)
    }

    if (!resposta.ok) throw new Error(`A API de embeddings do Google respondeu com erro ${resposta.status}.`)

    const dados = (await resposta.json().catch(() => null)) as { embeddings?: Array<{ values?: number[] }> } | null
    const vetores = dados?.embeddings?.map((e) => e.values)
    if (!vetores || vetores.length !== textos.length || vetores.some((v) => !Array.isArray(v) || v.length !== DIMENSOES)) {
      throw new Error("Resposta inesperada da API de embeddings do Google.")
    }
    return vetores as number[][]
  }

  async function emLotes(textos: string[], tipo: TipoTarefa): Promise<number[][]> {
    const saida: number[][] = []
    for (let i = 0; i < textos.length; i += MAX_POR_LOTE) {
      saida.push(...(await lote(textos.slice(i, i + MAX_POR_LOTE), tipo)))
    }
    return saida
  }

  return {
    embedDocumentos: (textos) => (textos.length === 0 ? Promise.resolve([]) : emLotes(textos, "RETRIEVAL_DOCUMENT")),
    embedConsulta: async (texto) => (await lote([texto], "RETRIEVAL_QUERY"))[0],
  }
}

/** Formato de texto que o PostgREST aceita para colunas/parâmetros `vector`. */
export function vetorParaTexto(vetor: number[]): string {
  return `[${vetor.join(",")}]`
}
