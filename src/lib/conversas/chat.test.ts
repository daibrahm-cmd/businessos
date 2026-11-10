// Testes da rodada do chat: repositório real sobre o banco falso, IA e conhecimento falsos (sem rede).
import { describe, expect, it, vi } from "vitest"
import { BancoFalso, criarClienteFalso } from "@/lib/armazenamento/supabase-falso"
import type { TrechoRecuperado } from "@/lib/conhecimento/tipos"
import { executarRodada, fontesDosTrechos, montarHistorico, tituloDaPergunta, type DependenciasChat } from "@/lib/conversas/chat"
import { criarRepositorioConversasSupabase } from "@/lib/conversas/repositorio-supabase"
import type { EventoChat, Mensagem } from "@/lib/conversas/tipos"

const ANA = "11111111-1111-4111-8111-111111111111"

const trecho = (id: string, titulo: string, conteudo = "texto"): TrechoRecuperado => ({
  conteudo,
  similaridade: 0.9,
  fonte: { origemTipo: "documento", origemId: id, titulo },
})

async function* deltas(...partes: string[]) {
  for (const p of partes) yield p
}

function montar(sobrescrever: Partial<DependenciasChat> = {}) {
  const banco = new BancoFalso()
  // Relógio que avança 1 s por leitura: mensagens no mesmo milissegundo não teriam ordem garantida.
  let t = Date.parse("2026-01-01T10:00:00Z")
  const repo = criarRepositorioConversasSupabase({ cliente: criarClienteFalso(banco), userId: ANA }, () => new Date((t += 1000)))
  const conhecimento = {
    buscarContexto: vi.fn().mockResolvedValue([trecho("direcao/oferta", "Oferta", "Mentoria por R$ 500"), trecho("direcao/oferta", "Oferta")]),
    indexarMensagem: vi.fn().mockResolvedValue(undefined),
  }
  const transmitir = vi.fn<DependenciasChat["transmitir"]>(() => deltas("Sua ", "oferta é mentoria."))
  const agendar = vi.fn()
  const deps: DependenciasChat = { repo, conhecimento, transmitir, agendar, ...sobrescrever }
  return { banco, repo, conhecimento, transmitir, agendar, deps }
}

async function coletar(g: AsyncIterable<EventoChat>): Promise<EventoChat[]> {
  const saida: EventoChat[] = []
  for await (const e of g) saida.push(e)
  return saida
}

describe("executarRodada", () => {
  it("conversa nova: eventos na ordem, título da pergunta, fontes deduplicadas e indexação das duas mensagens", async () => {
    const { repo, conhecimento, transmitir, agendar, deps } = montar()
    const eventos = await coletar(executarRodada({ pergunta: "Qual é a minha oferta?" }, deps))
    expect(eventos.map((e) => e.tipo)).toEqual(["conversa", "texto", "texto", "fim"])
    const fim = eventos[3] as Extract<EventoChat, { tipo: "fim" }>
    expect(fim.mensagem).toMatchObject({ papel: "assistente", conteudo: "Sua oferta é mentoria." })
    expect(fim.mensagem.fontes).toEqual([{ origemTipo: "documento", origemId: "direcao/oferta", titulo: "Oferta" }])

    expect(conhecimento.buscarContexto).toHaveBeenCalledWith("Qual é a minha oferta?", 6)
    const [mensagens, instrucoes] = transmitir.mock.calls[0]
    expect(mensagens).toEqual([{ papel: "user", conteudo: "Qual é a minha oferta?" }])
    expect(instrucoes).toContain("Mentoria por R$ 500")

    const resumo = (eventos[0] as Extract<EventoChat, { tipo: "conversa" }>).conversa
    expect(resumo.titulo).toBe("Qual é a minha oferta?")
    const salva = await repo.obterConversa(resumo.id)
    expect(salva?.mensagens.map((m) => m.papel)).toEqual(["usuario", "assistente"])
    expect(agendar).toHaveBeenCalledTimes(2)
    expect(conhecimento.indexarMensagem).toHaveBeenCalledWith(salva!.mensagens[0].id)
    expect(conhecimento.indexarMensagem).toHaveBeenCalledWith(salva!.mensagens[1].id)
  })

  it("segue sem contexto quando a busca falha ou vem vazia", async () => {
    for (const buscarContexto of [vi.fn().mockRejectedValue(new Error("pgvector fora")), vi.fn().mockResolvedValue([])]) {
      const erro = vi.spyOn(console, "error").mockImplementation(() => {})
      const { transmitir, deps } = montar({ conhecimento: { buscarContexto, indexarMensagem: vi.fn() } })
      const eventos = await coletar(executarRodada({ pergunta: "oi" }, deps))
      erro.mockRestore()
      expect(eventos.at(-1)?.tipo).toBe("fim")
      expect((eventos.at(-1) as Extract<EventoChat, { tipo: "fim" }>).mensagem.fontes).toEqual([])
      expect(transmitir.mock.calls[0][1]).toContain("Nenhum trecho relevante")
    }
  })

  it("conversa existente: envia histórico recente alternado e não troca o título", async () => {
    const { repo, transmitir, deps } = montar()
    const c = await repo.criarConversa("Título antigo")
    await repo.anexarMensagem({ conversaId: c.id, papel: "usuario", conteudo: "p1" })
    await repo.anexarMensagem({ conversaId: c.id, papel: "assistente", conteudo: "r1" })
    const eventos = await coletar(executarRodada({ conversaId: c.id, pergunta: "p2" }, deps))
    expect((eventos[0] as Extract<EventoChat, { tipo: "conversa" }>).conversa).toMatchObject({ id: c.id, titulo: "Título antigo" })
    expect((transmitir.mock.calls[0])[0]).toEqual([
      { papel: "user", conteudo: "p1" },
      { papel: "assistant", conteudo: "r1" },
      { papel: "user", conteudo: "p2" },
    ])
    expect((await repo.obterConversa(c.id))?.mensagens).toHaveLength(4)
  })

  it("conversa inexistente vira evento de erro e nada é salvo", async () => {
    const { repo, deps } = montar()
    const eventos = await coletar(executarRodada({ conversaId: ANA, pergunta: "oi" }, deps))
    expect(eventos).toEqual([{ tipo: "erro", mensagem: "Conversa não encontrada." }])
    expect(await repo.listarConversas()).toEqual([])
  })

  it("falha da IA: erro em português, pergunta fica salva, sem resposta e sem indexar", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    async function* quebra() {
      yield "parcial"
      throw new Error("A IA demorou demais para responder (120 s). Tente de novo.")
    }
    const { repo, agendar, deps } = montar({ transmitir: () => quebra() })
    const eventos = await coletar(executarRodada({ pergunta: "oi" }, deps))
    log.mockRestore()
    expect(eventos.at(-1)).toEqual({ tipo: "erro", mensagem: "A IA demorou demais para responder (120 s). Tente de novo." })
    const [resumo] = await repo.listarConversas()
    expect((await repo.obterConversa(resumo.id))?.mensagens.map((m) => m.papel)).toEqual(["usuario"])
    expect(agendar).not.toHaveBeenCalled()
  })

  it("erro interno (banco) não vaza detalhes", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    const { banco, deps } = montar()
    banco.falhas.conversas = "relation public.conversas segredo"
    const eventos = await coletar(executarRodada({ pergunta: "oi" }, deps))
    log.mockRestore()
    expect(eventos).toEqual([{ tipo: "erro", mensagem: "Não consegui concluir a resposta. Tente de novo." }])
  })

  it("resposta vazia é erro", async () => {
    const { deps } = montar({ transmitir: () => deltas("  ") })
    expect((await coletar(executarRodada({ pergunta: "oi" }, deps))).at(-1)).toMatchObject({ tipo: "erro" })
  })
})

describe("auxiliares", () => {
  it("tituloDaPergunta: uma linha, até 60 caracteres, corta em palavra", () => {
    expect(tituloDaPergunta("  Qual\n é   a oferta? ")).toBe("Qual é a oferta?")
    const t = tituloDaPergunta("palavra ".repeat(30))
    expect(t.length).toBeLessThanOrEqual(60)
    expect(t.endsWith("…")).toBe(true)
    expect(tituloDaPergunta("x".repeat(200)).length).toBe(60)
    expect(tituloDaPergunta("   ")).toBe("Nova conversa")
  })

  it("fontesDosTrechos deduplica por origem", () => {
    const f = fontesDosTrechos([trecho("a", "A"), trecho("b", "B"), trecho("a", "A")])
    expect(f.map((x) => x.origemId)).toEqual(["a", "b"])
  })

  it("montarHistorico limita a 10, começa em user e une papéis repetidos", () => {
    const m = (i: number, papel: "usuario" | "assistente"): Mensagem => ({ id: String(i), conversaId: "c", papel, conteudo: `m${i}`, fontes: [], criadoEm: "" })
    const longo = Array.from({ length: 30 }, (_, i) => m(i, i % 2 === 0 ? "usuario" : "assistente"))
    const h = montarHistorico(longo, "nova")
    expect(h[0].papel).toBe("user")
    expect(h.length).toBeLessThanOrEqual(11)
    expect(h.slice(-2)).toEqual([{ papel: "assistant", conteudo: "m29" }, { papel: "user", conteudo: "nova" }])
    // histórico terminando em "usuario" (pergunta sem resposta): une com a nova
    expect(montarHistorico([m(0, "assistente"), m(1, "usuario")], "q")).toEqual([{ papel: "user", conteudo: "m1\n\nq" }])
  })
})
