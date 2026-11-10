import { describe, expect, it, vi } from "vitest"
import { criarProvedorApi } from "@/lib/ia/claude-api"
import { obterProvedorIA, resolverModoIA } from "@/lib/ia/provedor"
import { provedorCli } from "@/lib/ia/claude-cli"

const env = (e: Record<string, string>) => e as unknown as NodeJS.ProcessEnv
const resp = (status: number, corpo: unknown = {}) =>
  new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json" } })

describe("seleção do provedor", () => {
  it("usa cli sem chave e api com chave", () => {
    expect(resolverModoIA(env({}))).toBe("cli")
    expect(resolverModoIA(env({ ANTHROPIC_API_KEY: "k" }))).toBe("api")
    expect(obterProvedorIA(env({}))).toBe(provedorCli)
  })
  it("BUSINESSOS_IA explícito vence", () => {
    expect(resolverModoIA(env({ BUSINESSOS_IA: "cli", ANTHROPIC_API_KEY: "k" }))).toBe("cli")
    expect(resolverModoIA(env({ BUSINESSOS_IA: "desligada" }))).toBe("desligada")
  })
  it("desligada falha com mensagem clara", async () => {
    await expect(obterProvedorIA(env({ BUSINESSOS_IA: "desligada" })).gerar("a", "b")).rejects.toThrow(/desligada/)
  })
})

describe("provedor api", () => {
  it("sucesso: envia headers, modelo e devolve o texto", async () => {
    const f = vi.fn().mockResolvedValue(resp(200, { content: [{ type: "text", text: " olá " }] }))
    const p = criarProvedorApi({ env: env({ ANTHROPIC_API_KEY: "segredo", BUSINESSOS_IA_MODELO: "m-x" }), fetchImpl: f })
    expect(await p.gerar("ctx", "instr", { maxTokens: 100 })).toBe("olá")
    const [url, init] = f.mock.calls[0]
    expect(url).toBe("https://api.anthropic.com/v1/messages")
    expect(init.headers["x-api-key"]).toBe("segredo")
    expect(init.headers["anthropic-version"]).toBeTruthy()
    const corpo = JSON.parse(init.body)
    expect(corpo).toMatchObject({ model: "m-x", max_tokens: 100, system: "instr" })
  })
  it("usa o modelo padrão", async () => {
    const f = vi.fn().mockResolvedValue(resp(200, { content: [{ type: "text", text: "ok" }] }))
    await criarProvedorApi({ env: env({ ANTHROPIC_API_KEY: "k" }), fetchImpl: f }).gerar("a", "b")
    expect(JSON.parse(f.mock.calls[0][1].body).model).toBe("claude-sonnet-5-5")
  })
  it("401 e 429 viram mensagens em português sem vazar a chave", async () => {
    const mk = (s: number) => criarProvedorApi({ env: env({ ANTHROPIC_API_KEY: "segredo" }), fetchImpl: vi.fn().mockResolvedValue(resp(s)) })
    await expect(mk(401).gerar("a", "b")).rejects.toThrow(/ANTHROPIC_API_KEY foi recusada/)
    await expect(mk(429).gerar("a", "b")).rejects.toThrow(/Limite de uso/)
    await expect(mk(503).gerar("a", "b")).rejects.toThrow(/instável/)
    await expect(mk(401).gerar("a", "b")).rejects.not.toThrow(/segredo/)
  })
  it("timeout aborta a requisição", async () => {
    const f = vi.fn((_u: string, init: RequestInit) =>
      new Promise((_, rej) => init.signal!.addEventListener("abort", () => rej(new Error("abortado")))),
    )
    const p = criarProvedorApi({ env: env({ ANTHROPIC_API_KEY: "k" }), fetchImpl: f as unknown as typeof fetch })
    await expect(p.gerar("a", "b", { tempoLimiteMs: 10 })).rejects.toThrow(/demorou demais/)
  })
  it("chave ausente: erro acionável e nenhuma chamada de rede", async () => {
    const f = vi.fn()
    const p = criarProvedorApi({ env: env({}), fetchImpl: f })
    await expect(p.gerar("a", "b")).rejects.toThrow(/defina ANTHROPIC_API_KEY no \.env\.local/i)
    expect(f).not.toHaveBeenCalled()
  })
})
