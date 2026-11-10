// Indexação: transforma documentos e mensagens em trechos com embedding na tabela `conhecimento`.
// Reindexação incremental: só os trechos cuja hash mudou são embedados de novo; trechos que
// deixaram de existir (documento ficou menor) são apagados.
import { createHash } from "node:crypto"
import type { ClienteSupabase } from "@/lib/armazenamento/acesso"
import { lancarSeErro } from "@/lib/armazenamento/acesso"
import { exportarMarkdown } from "@/lib/content/exportar-md"
import type { ContentDoc } from "@/lib/content/types"
import { dividirEmTrechos } from "@/lib/conhecimento/chunking"
import { vetorParaTexto, type ClienteEmbeddings } from "@/lib/conhecimento/embeddings"

export interface DependenciasIndexacao {
  /** Cliente que respeita o RLS do dono (ou o admin, na API de agentes e nos scripts). */
  cliente: ClienteSupabase
  userId: string
  embeddings: ClienteEmbeddings
}

export type OrigemTipo = "documento" | "mensagem"

export interface ResultadoIndexacao {
  /** Trechos embedados agora (novos ou alterados). */
  indexados: number
  /** Trechos iguais ao já guardado (nada a fazer). */
  inalterados: number
  /** Trechos órfãos apagados. */
  removidos: number
}

/** Mensagens muito longas são cortadas só para o embedding (o limite de entrada do modelo é finito). */
const MAX_CARACTERES_MENSAGEM = 8000
const CONFLITO = "usuario_id,origem_tipo,origem_id,trecho_indice"

export const calcularHash = (texto: string): string => createHash("sha256").update(texto).digest("hex")

/**
 * Texto indexável da página, reaproveitando a serialização do exportar-md.
 * Descarta o cabeçalho do export (com data de geração) e a linha de status (com data de edição),
 * que mudariam a hash sem mudar o conteúdo.
 */
export function textoDoDocumento(doc: ContentDoc): string {
  const md = exportarMarkdown([doc], {}, "")
  const inicio = md.indexOf("### ")
  const corpo = (inicio === -1 ? md : md.slice(inicio))
    .split("\n")
    .filter((linha) => !linha.startsWith("Status: "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return corpo.includes("_(sem conteúdo)_") ? "" : corpo
}

/** Sincroniza os trechos de uma origem com a tabela: embeda só o que mudou e apaga o que sobrou. */
export async function sincronizarTrechos(
  { cliente, userId, embeddings }: DependenciasIndexacao,
  origemTipo: OrigemTipo,
  origemId: string,
  trechos: string[],
): Promise<ResultadoIndexacao> {
  const existentes = await cliente
    .from("conhecimento")
    .select("trecho_indice, hash")
    .eq("usuario_id", userId)
    .eq("origem_tipo", origemTipo)
    .eq("origem_id", origemId)
  lancarSeErro(existentes.error, "ler conhecimento")
  const hashPorIndice = new Map<number, string>(
    ((existentes.data ?? []) as Array<{ trecho_indice: number; hash: string }>).map((l) => [l.trecho_indice, l.hash]),
  )

  const novos = trechos.map((conteudo, trecho_indice) => ({ conteudo, trecho_indice, hash: calcularHash(conteudo) }))
  const alterados = novos.filter((t) => hashPorIndice.get(t.trecho_indice) !== t.hash)

  if (alterados.length > 0) {
    const vetores = await embeddings.embedDocumentos(alterados.map((t) => t.conteudo.slice(0, MAX_CARACTERES_MENSAGEM)))
    const linhas = alterados.map((t, i) => ({
      usuario_id: userId,
      origem_tipo: origemTipo,
      origem_id: origemId,
      trecho_indice: t.trecho_indice,
      conteudo: t.conteudo,
      hash: t.hash,
      embedding: vetorParaTexto(vetores[i]),
    }))
    const { error } = await cliente.from("conhecimento").upsert(linhas, { onConflict: CONFLITO })
    lancarSeErro(error, "gravar conhecimento")
  }

  const orfaos = [...hashPorIndice.keys()].filter((i) => i >= trechos.length)
  if (orfaos.length > 0) {
    const { error } = await cliente
      .from("conhecimento")
      .delete()
      .eq("usuario_id", userId)
      .eq("origem_tipo", origemTipo)
      .eq("origem_id", origemId)
      .in("trecho_indice", orfaos)
    lancarSeErro(error, "apagar trechos órfãos")
  }

  return { indexados: alterados.length, inalterados: novos.length - alterados.length, removidos: orfaos.length }
}

export function indexarDocumentoCom(dep: DependenciasIndexacao, doc: ContentDoc): Promise<ResultadoIndexacao> {
  return sincronizarTrechos(dep, "documento", doc.id, dividirEmTrechos(textoDoDocumento(doc)))
}

/** 1 registro por mensagem (trecho 0). Lê a mensagem pelo cliente do dono, então o RLS vale. */
export async function indexarMensagemCom(dep: DependenciasIndexacao, mensagemId: string): Promise<ResultadoIndexacao | null> {
  const { data, error } = await dep.cliente.from("mensagens").select("id, conteudo").eq("id", mensagemId).maybeSingle()
  lancarSeErro(error, "ler mensagem")
  const conteudo = (data as { conteudo?: string } | null)?.conteudo?.trim()
  if (!conteudo) return null
  return sincronizarTrechos(dep, "mensagem", mensagemId, [conteudo])
}
