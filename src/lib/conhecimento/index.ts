// Ponto de entrada da base de conhecimento (pgvector). Invisível na interface: só alimenta a IA.
// Sem GOOGLE_API_KEY tudo aqui vira "não faz nada": buscarContexto devolve [] e indexar* só avisam.
import { backendDeArmazenamento, resolverAcessoSupabase, type OrigemAcesso } from "@/lib/armazenamento/acesso"
import { buscarContextoCom } from "@/lib/conhecimento/buscar"
import { criarClienteEmbeddings, embeddingsConfigurado } from "@/lib/conhecimento/embeddings"
import { indexarDocumentoCom, indexarMensagemCom } from "@/lib/conhecimento/indexar"
import type { ServicoConhecimento, TrechoRecuperado } from "@/lib/conhecimento/tipos"
import { contextoDoRepositorio, getContentRepository } from "@/lib/content/repository"
import { ehIdValido } from "@/lib/content/navigation"

export type { ServicoConhecimento, TrechoRecuperado } from "@/lib/conhecimento/tipos"

/** A base só existe no modo Supabase e com a chave do Google configurada. */
function disponivel(acao: string): boolean {
  if (backendDeArmazenamento() !== "supabase") return false
  if (!embeddingsConfigurado()) {
    console.warn(`[conhecimento] GOOGLE_API_KEY ausente: ${acao} ignorado.`)
    return false
  }
  return true
}

function registrarFalha(acao: string, erro: unknown): void {
  // Só a mensagem: o erro bruto poderia carregar detalhes da requisição.
  console.warn(`[conhecimento] falha ao ${acao}:`, erro instanceof Error ? erro.message : "erro desconhecido")
}

export async function buscarContexto(pergunta: string, limite?: number): Promise<TrechoRecuperado[]> {
  try {
    if (!disponivel("busca")) return []
    const { cliente } = await resolverAcessoSupabase("sessao")
    return await buscarContextoCom({ cliente, embeddings: criarClienteEmbeddings() }, pergunta, limite)
  } catch (erro) {
    registrarFalha("buscar contexto", erro)
    return []
  }
}

/** Usa o mesmo contexto do salvamento: sessão (RLS) na interface, chave de serviço na API de agentes. */
export async function indexarDocumento(id: string, origem: OrigemAcesso = contextoDoRepositorio()): Promise<void> {
  try {
    if (!ehIdValido(id) || !disponivel("indexação do documento")) return
    const acesso = await resolverAcessoSupabase(origem)
    const doc = await getContentRepository({ contexto: origem }).get(id)
    await indexarDocumentoCom({ ...acesso, embeddings: criarClienteEmbeddings() }, doc)
  } catch (erro) {
    registrarFalha(`indexar o documento ${id}`, erro)
  }
}

export async function indexarMensagem(mensagemId: string): Promise<void> {
  try {
    if (!disponivel("indexação da mensagem")) return
    const acesso = await resolverAcessoSupabase("sessao")
    await indexarMensagemCom({ ...acesso, embeddings: criarClienteEmbeddings() }, mensagemId)
  } catch (erro) {
    registrarFalha(`indexar a mensagem ${mensagemId}`, erro)
  }
}

/** Gancho do salvamento: dispara sem esperar e sem nunca lançar (indexarDocumento já engole os erros). */
export function agendarIndexacaoDocumento(id: string): void {
  void indexarDocumento(id)
}

export const servicoConhecimento: ServicoConhecimento = { buscarContexto, indexarDocumento, indexarMensagem }
