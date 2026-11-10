// Testes do streaming da API da Anthropic, com fetch falso (sem rede).
import { describe, expect, it, vi } from "vitest"
import { provedorCli } from "@/lib/ia/claude-cli"
import { transmitirApi, transmitirResposta } from "@/lib/ia/claude-api"

// O CLI real nunca roda nos testes.
vi.mock("@/lib/ia/claude-cli", () => ({ provedorCli: { gerar: vi.fn() } }))

const env = (e: Record<string, string>) => e as unknown as NodeJS.ProcessEnv

function evento(tipo: string, dados: object): string {
  return `event: ${tipo}\ndata: ${JSON.stringify({ type: tipo, ...dados })}\n\n`
}
const delta = (text: string) => evento("content_block_delta", { index: 0, delta: { type: "text_delta", text } })

/** Resposta SSE entregue em pedaços (pode cortar no meio de um evento). */
function sse(pedacos: string[], status = 200): Response {
  const enc = new TextEncoder()
  const corpo = new ReadableStream<Uint8Array>({
    start(c) {
      for (const p of pedacos) c.enqueue(enc.encode(p))
      c.close()
    },
  })
  return new Response(corpo, { status, headers: { "content-type": "text/event-stream" } })
}

async function coletar(it: AsyncIterable<string>): Promise<string[]> {
  const saida: string[] = []
  for await (const d of it) saida.push(d)
  return saida
}

const historico = [
  { papel: "user" as const, conteudo: "oi" },
  { papel: "assistant" as const, conteudo: "olá" },
  { papel: "user" as const, conteudo: "e agora?" },
]

describe("transmitirApi", () => {
  it("emite só os text_delta, junta eventos cortados e ignora o resto", async () => {
    const tudo =
      evento("message_start", { message: {} }) + delta("Ol") + evento("ping", {}) + delta("á, ") + delta("mundo") + evento("message_stop", {})
    const meio = Math.floor(tudo.length / 2)
    const f = vi.fn().mockResolvedValue(sse([tudo.slice(0, meio), tudo.slice(meio)]))
    const deltas = await coletar(transmitirApi(historico, "instr", { env: env({ ANTHROPIC_API_KEY: "segredo" }), fetchImpl: f }))
    expect(deltas.join("")).toBe("Olá, mundo")
  })

  it("envia stream:true, o histórico inteiro, o system e a chave só no header", async () => {
    const f = vi.fn().mockResolvedValue(sse([delta("x")]))
    await coletar(transmitirApi(historico, "instr", { env: env({ ANTHROPIC_API_KEY: "segredo", BUSINESSOS_IA_MODELO: "m-x" }), fetchImpl: f, maxTokens: 50 }))
    const [url, init] = f.mock.calls[0]
    expect(url).toBe("https://api.anthropic.com/v1/messages")
    expect(init.headers["x-api-key"]).toBe("segredo")
    const corpo = JSON.parse(init.body)
    expect(corpo).toMatchObject({ model: "m-x", max_tokens: 50, stream: true, system: "instr" })
    expect(corpo.messages).toEqual([
      { role: "user", content: "oi" },
      { role: "assistant", content: "olá" },
      { role: "user", content: "e agora?" },
    ])
    expect(init.body).not.toContain("segredo")
  })

  it("aceita CRLF nos eventos", async () => {
    const f = vi.fn().mockResolvedValue(sse([delta("a").replace(/\n/g, "\r\n"), delta("b").replace(/\n/g, "\r\n")]))
    expect((await coletar(transmitirApi(historico, "i", { env: env({ ANTHROPIC_API_KEY: "k" }), fetchImpl: f }))).join("")).toBe("ab")
  })

  it("sem chave, erro HTTP e evento de erro viram mensagens em português sem vazar a chave", async () => {
    await expect(coletar(transmitirApi(historico, "i", { env: env({}) }))).rejects.toThrow(/ANTHROPIC_API_KEY/)
    const mk = (s: number) =>
      transmitirApi(historico, "i", { env: env({ ANTHROPIC_API_KEY: "segredo" }), fetchImpl: vi.fn().mockResolvedValue(new Response("{}", { status: s })) })
    await expect(coletar(mk(401))).rejects.toThrow(/foi recusada/)
    await expect(coletar(mk(429))).rejects.toThrow(/Limite de uso/)
    await expect(coletar(mk(503))).rejects.toThrow(/instável/)
    const f = vi.fn().mockResolvedValue(sse([delta("a"), evento("error", { error: { type: "overloaded_error", message: "segredo" } })]))
    const erro = await coletar(transmitirApi(historico, "i", { env: env({ ANTHROPIC_API_KEY: "segredo" }), fetchImpl: f })).catch((e: Error) => e)
    expect(erro).toBeInstanceOf(Error)
    expect((erro as Error).message).not.toContain("segredo")
  })

  it("falha de rede não vaza a chave e timeout aborta", async () => {
    const f = vi.fn().mockRejectedValue(new Error("ECONNRESET"))
    await expect(coletar(transmitirApi(historico, "i", { env: env({ ANTHROPIC_API_KEY: "k" }), fetchImpl: f }))).rejects.toThrow(/Não consegui falar/)
    const lento = vi.fn(
      (_u: string, init: RequestInit) =>
        new Promise<Response>((_, rej) => init.signal?.addEventListener("abort", () => rej(new Error("abortado")))),
    )
    await expect(
      coletar(transmitirApi(historico, "i", { env: env({ ANTHROPIC_API_KEY: "k" }), fetchImpl: lento as unknown as typeof fetch, tempoLimiteMs: 10 })),
    ).rejects.toThrow(/demorou demais/)
  })
})

describe("transmitirResposta", () => {
  it("modo api faz streaming", async () => {
    const f = vi.fn().mockResolvedValue(sse([delta("a"), delta("b")]))
    expect(await coletar(transmitirResposta(historico, "i", { env: env({ ANTHROPIC_API_KEY: "k" }), fetchImpl: f }))).toEqual(["a", "b"])
  })
  it("modo cli gera tudo de uma vez e emite um único delta com o histórico achatado", async () => {
    vi.mocked(provedorCli.gerar).mockResolvedValue("resposta inteira")
    const f = vi.fn()
    const deltas = await coletar(transmitirResposta(historico, "instr", { env: env({ BUSINESSOS_IA: "cli" }), fetchImpl: f }))
    expect(deltas).toEqual(["resposta inteira"])
    const [contexto, instrucoes] = vi.mocked(provedorCli.gerar).mock.calls[0]
    expect(contexto).toContain("Assistente: olá")
    expect(contexto).toContain("e agora?")
    expect(instrucoes).toBe("instr")
    expect(f).not.toHaveBeenCalled()
  })
  it("BUSINESSOS_IA=desligada falha com mensagem clara, sem chamar a rede", async () => {
    const f = vi.fn()
    await expect(
      coletar(transmitirResposta(historico, "i", { env: env({ BUSINESSOS_IA: "desligada", ANTHROPIC_API_KEY: "k" }), fetchImpl: f })),
    ).rejects.toThrow(/desligada/)
    expect(f).not.toHaveBeenCalled()
  })
})
