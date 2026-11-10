// Backend Supabase das conversas: tabelas public.conversas e public.mensagens.
// O cliente é o do usuário logado, então o RLS já isola os dados; o filtro por usuario_id é defesa extra.
import { ehUuid, lancarSeErro, novoUuid, type AcessoSupabase } from "@/lib/armazenamento/acesso"
import { ErroConversas, type NovaMensagem, type RepositorioConversas } from "@/lib/conversas/repositorio"
import type { Conversa, FonteResposta, Mensagem, PapelMensagem, ResumoConversa } from "@/lib/conversas/tipos"

type LinhaConversa = { id: string; titulo: string; atualizado_em: string }
type LinhaMensagem = {
  id: string
  conversa_id: string
  papel: PapelMensagem
  conteudo: string
  fontes: unknown
  criado_em: string
}

const naoEncontrada = (id: string) => new ErroConversas("NAO_ENCONTRADO", `Conversa não encontrada: ${id}.`)

function resumo(l: LinhaConversa): ResumoConversa {
  return { id: l.id, titulo: l.titulo, atualizadoEm: l.atualizado_em }
}

/** `fontes` é jsonb: aceita só itens com o formato esperado e descarta o resto. */
function lerFontes(bruto: unknown): FonteResposta[] {
  if (!Array.isArray(bruto)) return []
  return bruto.filter(
    (f): f is FonteResposta =>
      typeof f === "object" &&
      f !== null &&
      (f.origemTipo === "documento" || f.origemTipo === "mensagem") &&
      typeof f.origemId === "string" &&
      typeof f.titulo === "string",
  )
}

function mensagem(l: LinhaMensagem): Mensagem {
  return {
    id: l.id,
    conversaId: l.conversa_id,
    papel: l.papel,
    conteudo: l.conteudo,
    fontes: lerFontes(l.fontes),
    criadoEm: l.criado_em,
  }
}

export function criarRepositorioConversasSupabase(
  { cliente, userId }: AcessoSupabase,
  agora: () => Date = () => new Date(),
): RepositorioConversas {
  async function buscarResumo(id: string): Promise<ResumoConversa | null> {
    if (!ehUuid(id)) return null // id que não é uuid nunca existe na tabela
    const { data, error } = await cliente
      .from("conversas")
      .select("id,titulo,atualizado_em")
      .eq("usuario_id", userId)
      .eq("id", id)
      .maybeSingle()
    lancarSeErro(error, "ler conversa")
    return data ? resumo(data as LinhaConversa) : null
  }

  return {
    async criarConversa(titulo) {
      const iso = agora().toISOString()
      const id = novoUuid()
      const { error } = await cliente
        .from("conversas")
        .insert({ id, usuario_id: userId, titulo, criado_em: iso, atualizado_em: iso })
      lancarSeErro(error, "criar conversa")
      return { id, titulo, atualizadoEm: iso }
    },

    async listarConversas() {
      const { data, error } = await cliente
        .from("conversas")
        .select("id,titulo,atualizado_em")
        .eq("usuario_id", userId)
        .order("atualizado_em", { ascending: false })
        .order("id", { ascending: true })
      lancarSeErro(error, "listar conversas")
      return ((data ?? []) as LinhaConversa[]).map(resumo)
    },

    async obterConversa(id): Promise<Conversa | null> {
      const base = await buscarResumo(id)
      if (!base) return null
      const { data, error } = await cliente
        .from("mensagens")
        .select("id,conversa_id,papel,conteudo,fontes,criado_em")
        .eq("usuario_id", userId)
        .eq("conversa_id", id)
        .order("criado_em", { ascending: true })
        .order("id", { ascending: true })
      lancarSeErro(error, "ler mensagens")
      return { ...base, mensagens: ((data ?? []) as LinhaMensagem[]).map(mensagem) }
    },

    async renomear(id, titulo) {
      if (!ehUuid(id)) throw naoEncontrada(id)
      const { data, error } = await cliente
        .from("conversas")
        .update({ titulo })
        .eq("usuario_id", userId)
        .eq("id", id)
        .select("id")
      lancarSeErro(error, "renomear conversa")
      if (!data || data.length === 0) throw naoEncontrada(id)
    },

    async excluir(id) {
      if (!ehUuid(id)) throw naoEncontrada(id)
      const { data, error } = await cliente
        .from("conversas")
        .delete()
        .eq("usuario_id", userId)
        .eq("id", id)
        .select("id")
      lancarSeErro(error, "excluir conversa")
      if (!data || data.length === 0) throw naoEncontrada(id)
    },

    async anexarMensagem(nova: NovaMensagem) {
      if (!(await buscarResumo(nova.conversaId))) throw naoEncontrada(nova.conversaId)
      const iso = agora().toISOString()
      const fontes = nova.fontes ?? []
      const id = novoUuid()
      const { error } = await cliente.from("mensagens").insert({
        id,
        conversa_id: nova.conversaId,
        usuario_id: userId,
        papel: nova.papel,
        conteudo: nova.conteudo,
        fontes,
        criado_em: iso,
      })
      lancarSeErro(error, "salvar mensagem")
      const { error: erroConversa } = await cliente
        .from("conversas")
        .update({ atualizado_em: iso })
        .eq("usuario_id", userId)
        .eq("id", nova.conversaId)
      lancarSeErro(erroConversa, "atualizar conversa")
      return { id, conversaId: nova.conversaId, papel: nova.papel, conteudo: nova.conteudo, fontes, criadoEm: iso }
    },
  }
}
