import { describe, expect, it, vi } from "vitest"
import { buscarContextoCom, tituloDaOrigem } from "@/lib/conhecimento/buscar"
import { DIMENSOES, type ClienteEmbeddings } from "@/lib/conhecimento/embeddings"
import { BancoConhecimento, criarClienteConhecimentoFalso } from "@/lib/conhecimento/supabase-falso"

function montar() {
  const banco = new BancoConhecimento()
  const embedConsulta = vi.fn(async () => Array.from({ length: DIMENSOES }, () => 0.25))
  const embeddings: ClienteEmbeddings = { embedDocumentos: vi.fn(), embedConsulta }
  return { banco, embedConsulta, dep: { cliente: criarClienteConhecimentoFalso(banco), embeddings } }
}

describe("buscarContextoCom", () => {
  it("embeda a pergunta, chama a RPC e monta os trechos com título legível", async () => {
    const { banco, dep } = montar()
    banco.rpcResposta = [
      { conteudo: "Trecho A", origem_tipo: "documento", origem_id: "validacao/oferta", similaridade: 0.9 },
      { conteudo: "Trecho B", origem_tipo: "mensagem", origem_id: "m1", similaridade: 0.6 },
    ]
    const r = await buscarContextoCom(dep, "Qual é a oferta?", 4)
    expect(banco.rpcChamadas).toHaveLength(1)
    expect(banco.rpcChamadas[0].nome).toBe("buscar_conhecimento")
    expect(banco.rpcChamadas[0].args.limite).toBe(4)
    expect(String(banco.rpcChamadas[0].args.consulta).startsWith("[0.25,")).toBe(true)
    expect(r).toEqual([
      { conteudo: "Trecho A", similaridade: 0.9, fonte: { origemTipo: "documento", origemId: "validacao/oferta", titulo: "Validação · Oferta" } },
      { conteudo: "Trecho B", similaridade: 0.6, fonte: { origemTipo: "mensagem", origemId: "m1", titulo: "Conversa anterior" } },
    ])
  })

  it("descarta trechos de baixa similaridade", async () => {
    const { banco, dep } = montar()
    banco.rpcResposta = [{ conteudo: "ruído", origem_tipo: "documento", origem_id: "founder/objetivo", similaridade: 0.1 }]
    expect(await buscarContextoCom(dep, "oi")).toEqual([])
  })

  it("pergunta vazia não chama embedding nem RPC", async () => {
    const { banco, embedConsulta, dep } = montar()
    expect(await buscarContextoCom(dep, "   ")).toEqual([])
    expect(embedConsulta).not.toHaveBeenCalled()
    expect(banco.rpcChamadas).toHaveLength(0)
  })

  it("tituloDaOrigem tolera id de documento desconhecido", () => {
    expect(tituloDaOrigem("documento", "xx/yy")).toBe("xx/yy")
  })
})
