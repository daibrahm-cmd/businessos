// Testes do repositório de conversas, com cliente Supabase falso em memória (sem rede).
import { describe, expect, it } from "vitest"
import { BancoFalso, criarClienteFalso } from "@/lib/armazenamento/supabase-falso"
import { ErroConversas } from "@/lib/conversas/repositorio"
import { criarRepositorioConversasSupabase } from "@/lib/conversas/repositorio-supabase"

const ANA = "11111111-1111-4111-8111-111111111111"
const BIA = "22222222-2222-4222-8222-222222222222"

/** Relógio que avança 1 s a cada leitura, para ordenar de forma previsível. */
function relogio() {
  let t = Date.parse("2026-01-01T10:00:00Z")
  return () => new Date((t += 1000))
}

// Sem userId no cliente falso: o fake emula RLS por `user_id`, e aqui a coluna é `usuario_id` (filtrada pelo repositório).
function novo(userId = ANA, banco = new BancoFalso()) {
  return { banco, repo: criarRepositorioConversasSupabase({ cliente: criarClienteFalso(banco), userId }, relogio()) }
}

describe("conversas no Supabase", () => {
  it("cria, lista (mais recente primeiro) e atualiza a ordem ao anexar mensagem", async () => {
    const { banco, repo } = novo()
    const a = await repo.criarConversa("Primeira")
    const b = await repo.criarConversa("Segunda")
    expect(banco.tabelas.conversas[0]).toMatchObject({ id: a.id, usuario_id: ANA, titulo: "Primeira" })
    expect((await repo.listarConversas()).map((c) => c.titulo)).toEqual(["Segunda", "Primeira"])
    await repo.anexarMensagem({ conversaId: a.id, papel: "usuario", conteudo: "oi" })
    const lista = await repo.listarConversas()
    expect(lista.map((c) => c.id)).toEqual([a.id, b.id])
    expect(lista[0].atualizadoEm > b.atualizadoEm).toBe(true)
  })

  it("devolve a conversa com as mensagens em ordem e as fontes", async () => {
    const { banco, repo } = novo()
    const c = await repo.criarConversa("T")
    const fontes = [{ origemTipo: "documento" as const, origemId: "direcao/oferta", titulo: "Oferta" }]
    await repo.anexarMensagem({ conversaId: c.id, papel: "usuario", conteudo: "pergunta" })
    const resp = await repo.anexarMensagem({ conversaId: c.id, papel: "assistente", conteudo: "resposta", fontes })
    expect(banco.tabelas.mensagens[1]).toMatchObject({ conversa_id: c.id, usuario_id: ANA, papel: "assistente", fontes })
    const conversa = await repo.obterConversa(c.id)
    expect(conversa?.mensagens.map((m) => m.papel)).toEqual(["usuario", "assistente"])
    expect(conversa?.mensagens[1]).toEqual(resp)
    expect(conversa?.mensagens[0].fontes).toEqual([])
  })

  it("renomeia e exclui", async () => {
    const { repo } = novo()
    const c = await repo.criarConversa("Velho")
    await repo.renomear(c.id, "Novo")
    expect((await repo.obterConversa(c.id))?.titulo).toBe("Novo")
    await repo.excluir(c.id)
    expect(await repo.obterConversa(c.id)).toBeNull()
    expect(await repo.listarConversas()).toEqual([])
  })

  it("id inexistente ou que não é uuid: obter devolve null; demais lançam NAO_ENCONTRADO", async () => {
    const { repo } = novo()
    expect(await repo.obterConversa("x")).toBeNull()
    expect(await repo.obterConversa(BIA)).toBeNull()
    for (const id of ["x", BIA]) {
      await expect(repo.renomear(id, "a")).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" })
      await expect(repo.excluir(id)).rejects.toBeInstanceOf(ErroConversas)
      await expect(repo.anexarMensagem({ conversaId: id, papel: "usuario", conteudo: "a" })).rejects.toMatchObject({
        codigo: "NAO_ENCONTRADO",
      })
    }
  })

  it("isola por usuário", async () => {
    const banco = new BancoFalso()
    const ana = novo(ANA, banco).repo
    const bia = novo(BIA, banco).repo
    const c = await ana.criarConversa("da Ana")
    await ana.anexarMensagem({ conversaId: c.id, papel: "usuario", conteudo: "segredo" })
    expect(await bia.listarConversas()).toEqual([])
    expect(await bia.obterConversa(c.id)).toBeNull()
    await expect(bia.renomear(c.id, "x")).rejects.toBeInstanceOf(ErroConversas)
    await expect(bia.excluir(c.id)).rejects.toBeInstanceOf(ErroConversas)
    await expect(bia.anexarMensagem({ conversaId: c.id, papel: "usuario", conteudo: "x" })).rejects.toBeInstanceOf(ErroConversas)
    expect((await ana.obterConversa(c.id))?.mensagens).toHaveLength(1)
  })

  it("falha do banco vira Error com contexto", async () => {
    const { banco, repo } = novo()
    banco.falhas.conversas = "boom"
    await expect(repo.listarConversas()).rejects.toThrow(/listar conversas/)
  })
})
