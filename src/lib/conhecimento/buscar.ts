// Busca semântica: embeda a pergunta, chama a RPC buscar_conhecimento (SECURITY INVOKER, então o
// RLS limita ao usuário logado) e devolve os trechos já com título legível para as "fontes".
import type { ClienteSupabase } from "@/lib/armazenamento/acesso"
import { ehIdValido, obterPagina } from "@/lib/content/navigation"
import { vetorParaTexto, type ClienteEmbeddings } from "@/lib/conhecimento/embeddings"
import type { TrechoRecuperado } from "@/lib/conhecimento/tipos"

export const LIMITE_PADRAO = 6
/** Abaixo disso o trecho é ruído e só atrapalharia a resposta. */
export const SIMILARIDADE_MINIMA = 0.35

interface LinhaBusca {
  conteudo: string
  origem_tipo: "documento" | "mensagem"
  origem_id: string
  similaridade: number
}

/** "Direção · Oferta" para `direcao/oferta`; "Conversa anterior" para mensagens. */
export function tituloDaOrigem(origemTipo: "documento" | "mensagem", origemId: string): string {
  if (origemTipo === "mensagem") return "Conversa anterior"
  if (!ehIdValido(origemId)) return origemId
  const { secao, pagina } = obterPagina(origemId)
  return `${secao.nome} · ${pagina.titulo}`
}

export async function buscarContextoCom(
  { cliente, embeddings }: { cliente: ClienteSupabase; embeddings: ClienteEmbeddings },
  pergunta: string,
  limite: number = LIMITE_PADRAO,
): Promise<TrechoRecuperado[]> {
  if (!pergunta.trim()) return []
  const vetor = await embeddings.embedConsulta(pergunta)
  const { data, error } = await cliente.rpc("buscar_conhecimento", { consulta: vetorParaTexto(vetor), limite })
  if (error) throw new Error(`Supabase (buscar conhecimento): ${error.message}`)

  return ((data ?? []) as LinhaBusca[])
    .filter((l) => l.similaridade >= SIMILARIDADE_MINIMA)
    .map((l) => ({
      conteudo: l.conteudo,
      similaridade: l.similaridade,
      fonte: { origemTipo: l.origem_tipo, origemId: l.origem_id, titulo: tituloDaOrigem(l.origem_tipo, l.origem_id) },
    }))
}
