import { describe, expect, it, vi } from "vitest"
import type { ClienteEmbeddings } from "@/lib/conhecimento/embeddings"
import { DIMENSOES } from "@/lib/conhecimento/embeddings"
import { calcularHash, indexarDocumentoCom, indexarMensagemCom, sincronizarTrechos, textoDoDocumento } from "@/lib/conhecimento/indexar"
import { BancoConhecimento, criarClienteConhecimentoFalso } from "@/lib/conhecimento/supabase-falso"
import { obterDefinicao } from "@/lib/content/schemas"
import { criarTemplate } from "@/lib/content/schemas/build"

const criarDocumentoVazio = (id: "direcao/oferta") => criarTemplate(obterDefinicao(id))

const USUARIO = "11111111-1111-1111-1111-111111111111"

function montar() {
  const banco = new BancoConhecimento()
  const embedDocumentos = vi.fn(async (textos: string[]) => textos.map(() => Array.from({ length: DIMENSOES }, () => 0.5)))
  const embeddings: ClienteEmbeddings = { embedDocumentos, embedConsulta: vi.fn() }
  return { banco, embedDocumentos, dep: { cliente: criarClienteConhecimentoFalso(banco), userId: USUARIO, embeddings } }
}

describe("sincronizarTrechos", () => {
  it("primeira vez: embeda e grava tudo", async () => {
    const { banco, embedDocumentos, dep } = montar()
    const r = await sincronizarTrechos(dep, "documento", "direcao/oferta", ["a", "b"])
    expect(r).toEqual({ indexados: 2, inalterados: 0, removidos: 0 })
    expect(embedDocumentos).toHaveBeenCalledWith(["a", "b"])
    expect(banco.tabelas.conhecimento).toHaveLength(2)
    expect(banco.tabelas.conhecimento[0]).toMatchObject({ usuario_id: USUARIO, hash: calcularHash("a"), trecho_indice: 0 })
    expect(String(banco.tabelas.conhecimento[0].embedding).startsWith("[0.5,")).toBe(true)
  })

  it("sem mudanças não chama o embedding nem grava", async () => {
    const { banco, embedDocumentos, dep } = montar()
    await sincronizarTrechos(dep, "documento", "d", ["a", "b"])
    embedDocumentos.mockClear()
    const upserts = banco.upserts
    const r = await sincronizarTrechos(dep, "documento", "d", ["a", "b"])
    expect(r).toEqual({ indexados: 0, inalterados: 2, removidos: 0 })
    expect(embedDocumentos).not.toHaveBeenCalled()
    expect(banco.upserts).toBe(upserts)
  })

  it("só reembeda o trecho cuja hash mudou", async () => {
    const { banco, embedDocumentos, dep } = montar()
    await sincronizarTrechos(dep, "documento", "d", ["a", "b", "c"])
    embedDocumentos.mockClear()
    const r = await sincronizarTrechos(dep, "documento", "d", ["a", "B", "c"])
    expect(r).toEqual({ indexados: 1, inalterados: 2, removidos: 0 })
    expect(embedDocumentos).toHaveBeenCalledWith(["B"])
    expect(banco.tabelas.conhecimento.find((l) => l.trecho_indice === 1)?.conteudo).toBe("B")
  })

  it("apaga trechos órfãos quando o documento encolhe, sem tocar em outras origens", async () => {
    const { banco, dep } = montar()
    await sincronizarTrechos(dep, "documento", "d", ["a", "b", "c"])
    await sincronizarTrechos(dep, "documento", "outro", ["z"])
    const r = await sincronizarTrechos(dep, "documento", "d", ["a"])
    expect(r.removidos).toBe(2)
    expect(banco.tabelas.conhecimento.filter((l) => l.origem_id === "d")).toHaveLength(1)
    expect(banco.tabelas.conhecimento.filter((l) => l.origem_id === "outro")).toHaveLength(1)
  })

  it("lista vazia apaga tudo da origem", async () => {
    const { banco, dep } = montar()
    await sincronizarTrechos(dep, "documento", "d", ["a", "b"])
    await sincronizarTrechos(dep, "documento", "d", [])
    expect(banco.tabelas.conhecimento).toHaveLength(0)
  })
})

describe("documento", () => {
  it("o texto indexável não depende da data de edição", () => {
    const doc = criarDocumentoVazio("direcao/oferta")
    doc.corpo = "Notas sobre a oferta."
    const a = textoDoDocumento(doc)
    const b = textoDoDocumento({ ...doc, atualizado_em: "2030-01-01T00:00:00.000Z", atualizado_por: "agente:x" })
    expect(a).toContain("Notas sobre a oferta.")
    expect(a).toBe(b)
  })

  it("documento vazio não gera trechos; reindexar o mesmo documento é no-op", async () => {
    const { banco, embedDocumentos, dep } = montar()
    const vazio = criarDocumentoVazio("direcao/oferta")
    expect(textoDoDocumento(vazio)).toBe("")

    const doc = { ...vazio, corpo: "Algo importante." }
    const r1 = await indexarDocumentoCom(dep, doc)
    expect(r1.indexados).toBeGreaterThan(0)
    embedDocumentos.mockClear()
    const r2 = await indexarDocumentoCom(dep, { ...doc, atualizado_em: "2031-01-01T00:00:00.000Z" })
    expect(r2.indexados).toBe(0)
    expect(embedDocumentos).not.toHaveBeenCalled()

    await indexarDocumentoCom(dep, vazio)
    expect(banco.tabelas.conhecimento).toHaveLength(0)
  })
})

describe("mensagem", () => {
  it("indexa 1 registro por mensagem", async () => {
    const { banco, dep } = montar()
    banco.tabelas.mensagens.push({ id: "m1", conteudo: "Qual é a minha oferta?" })
    await indexarMensagemCom(dep, "m1")
    expect(banco.tabelas.conhecimento).toHaveLength(1)
    expect(banco.tabelas.conhecimento[0]).toMatchObject({ origem_tipo: "mensagem", origem_id: "m1", trecho_indice: 0 })
  })

  it("mensagem inexistente não faz nada", async () => {
    const { banco, dep } = montar()
    expect(await indexarMensagemCom(dep, "nao-existe")).toBeNull()
    expect(banco.tabelas.conhecimento).toHaveLength(0)
  })
})
