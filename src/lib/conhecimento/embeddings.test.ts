import { describe, expect, it, vi } from "vitest"
import { criarClienteEmbeddings, DIMENSOES, embeddingsConfigurado, vetorParaTexto } from "@/lib/conhecimento/embeddings"

const vetor = () => Array.from({ length: DIMENSOES }, () => 0.1)

function fetchFalso(status = 200) {
  return vi.fn(async (_url: unknown, init?: RequestInit) => {
    const n = (JSON.parse(String(init?.body)) as { requests: unknown[] }).requests.length
    return new Response(JSON.stringify({ embeddings: Array.from({ length: n }, () => ({ values: vetor() })) }), { status })
  })
}

describe("embeddings", () => {
  it("embeddingsConfigurado depende de GOOGLE_API_KEY", () => {
    expect(embeddingsConfigurado({})).toBe(false)
    expect(embeddingsConfigurado({ GOOGLE_API_KEY: " " })).toBe(false)
    expect(embeddingsConfigurado({ GOOGLE_API_KEY: "k" })).toBe(true)
  })

  it("documentos: batchEmbedContents com RETRIEVAL_DOCUMENT, 768 dimensões e chave só no header", async () => {
    const fetchImpl = fetchFalso()
    const c = criarClienteEmbeddings({ env: { GOOGLE_API_KEY: "segredo" }, fetchImpl: fetchImpl as unknown as typeof fetch })
    const r = await c.embedDocumentos(["a", "b"])
    expect(r).toHaveLength(2)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(String(url)).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents")
    expect(String(url)).not.toContain("segredo")
    expect((init?.headers as Record<string, string>)["x-goog-api-key"]).toBe("segredo")
    const corpo = JSON.parse(String(init?.body)) as { requests: Array<Record<string, unknown>> }
    expect(corpo.requests[0]).toMatchObject({
      model: "models/gemini-embedding-001",
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: 768,
      content: { parts: [{ text: "a" }] },
    })
  })

  it("consulta usa RETRIEVAL_QUERY e o modelo configurável", async () => {
    const fetchImpl = fetchFalso()
    const c = criarClienteEmbeddings({
      env: { GOOGLE_API_KEY: "k", GOOGLE_EMBEDDING_MODELO: "outro-modelo" },
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    expect(await c.embedConsulta("pergunta")).toHaveLength(DIMENSOES)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(String(url)).toContain("models/outro-modelo:batchEmbedContents")
    expect(JSON.parse(String(init?.body)).requests[0].taskType).toBe("RETRIEVAL_QUERY")
  })

  it("divide em lotes de 100", async () => {
    const fetchImpl = fetchFalso()
    const c = criarClienteEmbeddings({ env: { GOOGLE_API_KEY: "k" }, fetchImpl: fetchImpl as unknown as typeof fetch })
    const r = await c.embedDocumentos(Array.from({ length: 150 }, (_, i) => `t${i}`))
    expect(r).toHaveLength(150)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("sem chave lança erro claro e não chama a rede", async () => {
    const fetchImpl = fetchFalso()
    const c = criarClienteEmbeddings({ env: {}, fetchImpl: fetchImpl as unknown as typeof fetch })
    await expect(c.embedConsulta("x")).rejects.toThrow(/GOOGLE_API_KEY/)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("erro HTTP e falha de rede não vazam a chave", async () => {
    const http = criarClienteEmbeddings({ env: { GOOGLE_API_KEY: "segredo" }, fetchImpl: fetchFalso(500) as unknown as typeof fetch })
    await expect(http.embedConsulta("x")).rejects.toThrow(/500/)

    const rede = criarClienteEmbeddings({
      env: { GOOGLE_API_KEY: "segredo" },
      fetchImpl: (async () => {
        throw new Error("falhou https://x?key=segredo")
      }) as unknown as typeof fetch,
    })
    const erro = await rede.embedConsulta("x").catch((e: Error) => e)
    expect((erro as Error).message).not.toContain("segredo")
  })

  it("resposta com dimensão errada é rejeitada", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ embeddings: [{ values: [1, 2] }] })))
    const c = criarClienteEmbeddings({ env: { GOOGLE_API_KEY: "k" }, fetchImpl: fetchImpl as unknown as typeof fetch })
    await expect(c.embedConsulta("x")).rejects.toThrow(/inesperada/)
  })

  it("estoura o tempo limite", async () => {
    const fetchImpl = (async (_u: unknown, init?: RequestInit) =>
      new Promise((_, rejeitar) => init?.signal?.addEventListener("abort", () => rejeitar(new Error("abortado"))))) as unknown as typeof fetch
    const c = criarClienteEmbeddings({ env: { GOOGLE_API_KEY: "k" }, fetchImpl, tempoLimiteMs: 10 })
    await expect(c.embedConsulta("x")).rejects.toThrow(/não respondeu/)
  })

  it("vetorParaTexto gera o literal do pgvector", () => {
    expect(vetorParaTexto([1, 0.5])).toBe("[1,0.5]")
  })
})
