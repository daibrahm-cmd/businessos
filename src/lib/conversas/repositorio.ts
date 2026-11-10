// Contrato de persistência das conversas do chat. A implementação real é repositorio-supabase.ts (RLS por usuário).
import type { Conversa, FonteResposta, Mensagem, PapelMensagem, ResumoConversa } from "@/lib/conversas/tipos"

export interface NovaMensagem {
  conversaId: string
  papel: PapelMensagem
  conteudo: string
  fontes?: FonteResposta[]
}

export type CodigoErroConversas = "NAO_ENCONTRADO"

export class ErroConversas extends Error {
  constructor(
    public readonly codigo: CodigoErroConversas,
    mensagem: string,
  ) {
    super(mensagem)
    this.name = "ErroConversas"
  }
}

export interface RepositorioConversas {
  criarConversa(titulo: string): Promise<ResumoConversa>
  /** Mais recentemente atualizada primeiro. */
  listarConversas(): Promise<ResumoConversa[]>
  /** Conversa com as mensagens em ordem cronológica; `null` se não existir (ou não for do usuário). */
  obterConversa(id: string): Promise<Conversa | null>
  renomear(id: string, titulo: string): Promise<void>
  /** Apaga a conversa e suas mensagens (cascata no banco). */
  excluir(id: string): Promise<void>
  /** Grava a mensagem e marca a conversa como atualizada agora. */
  anexarMensagem(nova: NovaMensagem): Promise<Mensagem>
}
