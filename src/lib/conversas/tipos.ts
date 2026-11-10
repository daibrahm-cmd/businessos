// Contrato compartilhado do chat com a IA (banco, API e interface usam estes tipos).

export type PapelMensagem = "usuario" | "assistente"

/** Trecho da base de conhecimento usado para embasar uma resposta (mostrado só como "fontes", nunca como lista da base). */
export interface FonteResposta {
  /** Ex.: "documento" (página do BusinessOS) ou "mensagem" (conversa anterior). */
  origemTipo: "documento" | "mensagem"
  /** Id do documento (`secao/pagina`) ou da mensagem. */
  origemId: string
  titulo: string
}

export interface Mensagem {
  id: string
  conversaId: string
  papel: PapelMensagem
  conteudo: string
  fontes: FonteResposta[]
  criadoEm: string
}

export interface ResumoConversa {
  id: string
  titulo: string
  atualizadoEm: string
}

export interface Conversa extends ResumoConversa {
  mensagens: Mensagem[]
}

/**
 * Corpo do POST /api/chat.
 * - `conversaId` ausente: cria a conversa (título vem da 1ª pergunta).
 * Resposta: stream NDJSON (`application/x-ndjson`), uma linha JSON por evento:
 *   { "tipo": "conversa", "conversa": ResumoConversa }   // 1º evento
 *   { "tipo": "texto", "delta": string }                  // pedaços da resposta
 *   { "tipo": "fim", "mensagem": Mensagem }               // resposta final já salva
 *   { "tipo": "erro", "mensagem": string }
 */
export interface CorpoChat {
  conversaId?: string
  pergunta: string
}

export type EventoChat =
  | { tipo: "conversa"; conversa: ResumoConversa }
  | { tipo: "texto"; delta: string }
  | { tipo: "fim"; mensagem: Mensagem }
  | { tipo: "erro"; mensagem: string }
