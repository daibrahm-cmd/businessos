// Estado do chat (mensagens + stream) como reducer puro, fácil de testar.
import type { Conversa, EventoChat, Mensagem } from "@/lib/conversas/tipos"

export type StatusChat = "ocioso" | "aguardando" | "transmitindo"

export interface EstadoChat {
  conversaId: string | null
  mensagens: Mensagem[]
  /** Texto da resposta que ainda está chegando (some quando chega o evento `fim`). */
  textoParcial: string
  status: StatusChat
  /** Mensagem amigável do último erro (limpa ao enviar de novo). */
  erro: string | null
  /** Última pergunta enviada, usada por "Tentar de novo". */
  ultimaPergunta: string | null
}

export type AcaoChat =
  | { tipo: "enviar"; pergunta: string; idTemporario: string; agora: string }
  | { tipo: "evento"; evento: EventoChat }
  | { tipo: "falha"; mensagem: string }
  /** O usuário apertou "Parar": mantém o que já chegou como resposta. */
  | { tipo: "interromper"; idTemporario: string; agora: string }
  /** Remove a pergunta que falhou para reenviá-la sem duplicar na tela. */
  | { tipo: "descartar-ultima-pergunta" }
  | { tipo: "reiniciar" }

export const ESTADO_INICIAL: EstadoChat = {
  conversaId: null,
  mensagens: [],
  textoParcial: "",
  status: "ocioso",
  erro: null,
  ultimaPergunta: null,
}

/** Estado de uma conversa já salva (página /principal/[id]). */
export function estadoDaConversa(conversa?: Conversa): EstadoChat {
  if (!conversa) return ESTADO_INICIAL
  return { ...ESTADO_INICIAL, conversaId: conversa.id, mensagens: conversa.mensagens }
}

export function reducerChat(estado: EstadoChat, acao: AcaoChat): EstadoChat {
  switch (acao.tipo) {
    case "enviar": {
      const mensagem: Mensagem = {
        id: acao.idTemporario,
        conversaId: estado.conversaId ?? "",
        papel: "usuario",
        conteudo: acao.pergunta,
        fontes: [],
        criadoEm: acao.agora,
      }
      return {
        ...estado,
        mensagens: [...estado.mensagens, mensagem],
        textoParcial: "",
        status: "aguardando",
        erro: null,
        ultimaPergunta: acao.pergunta,
      }
    }

    case "evento": {
      const evento = acao.evento
      if (evento.tipo === "conversa") {
        // Conversa criada: a pergunta otimista passa a pertencer a ela
        return {
          ...estado,
          conversaId: evento.conversa.id,
          mensagens: estado.mensagens.map((m) =>
            m.conversaId === "" ? { ...m, conversaId: evento.conversa.id } : m,
          ),
        }
      }
      if (evento.tipo === "texto") {
        return { ...estado, status: "transmitindo", textoParcial: estado.textoParcial + evento.delta }
      }
      if (evento.tipo === "fim") {
        return {
          ...estado,
          mensagens: [...estado.mensagens, evento.mensagem],
          textoParcial: "",
          status: "ocioso",
        }
      }
      // erro enviado pelo servidor dentro do stream
      return { ...estado, textoParcial: "", status: "ocioso", erro: evento.mensagem }
    }

    case "falha":
      return { ...estado, textoParcial: "", status: "ocioso", erro: acao.mensagem }

    case "interromper": {
      if (estado.status === "ocioso") return estado
      const texto = estado.textoParcial.trim()
      const mensagens =
        texto === ""
          ? estado.mensagens
          : [
              ...estado.mensagens,
              {
                id: acao.idTemporario,
                conversaId: estado.conversaId ?? "",
                papel: "assistente" as const,
                conteudo: estado.textoParcial,
                fontes: [],
                criadoEm: acao.agora,
              },
            ]
      return { ...estado, mensagens, textoParcial: "", status: "ocioso" }
    }

    case "descartar-ultima-pergunta": {
      const ultima = estado.mensagens[estado.mensagens.length - 1]
      if (!ultima || ultima.papel !== "usuario") return { ...estado, erro: null }
      return { ...estado, mensagens: estado.mensagens.slice(0, -1), erro: null }
    }

    case "reiniciar":
      return ESTADO_INICIAL
  }
}
