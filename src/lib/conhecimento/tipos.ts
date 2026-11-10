// Contrato da base de conhecimento (pgvector). Invisível na interface: só alimenta as respostas da IA.
import type { FonteResposta } from "@/lib/conversas/tipos"

/** Funções que o módulo de conhecimento exporta (implementadas em src/lib/conhecimento/index.ts). */
export interface TrechoRecuperado {
  conteudo: string
  fonte: FonteResposta
  /** Similaridade de cosseno, 0..1. */
  similaridade: number
}

export interface ServicoConhecimento {
  /** Busca os trechos mais próximos da pergunta, só do usuário logado (RLS). */
  buscarContexto(pergunta: string, limite?: number): Promise<TrechoRecuperado[]>
  /** (Re)indexa um documento do BusinessOS. Chamado após salvar a página. Nunca lança: falha só é registrada. */
  indexarDocumento(id: string): Promise<void>
  /** Indexa uma mensagem (pergunta ou resposta) da conversa. Nunca lança. */
  indexarMensagem(mensagemId: string): Promise<void>
}
