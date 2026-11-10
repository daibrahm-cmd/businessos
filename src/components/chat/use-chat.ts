"use client"

// Hook do chat: estado (reducer) + POST /api/chat com leitura do stream NDJSON.
import * as React from "react"

import type { Conversa, CorpoChat, Mensagem, ResumoConversa } from "@/lib/conversas/tipos"

import { estadoDaConversa, reducerChat } from "./mensagens-reducer"
import { lerEventosChat } from "./ndjson"

const MSG_GENERICA = "Não consegui falar com a IA agora. Tente de novo em instantes."

/** Traduz o status HTTP em uma frase amigável. */
export function mensagemDeErroHttp(status: number): string {
  if (status === 401 || status === 403) return "Sua sessão expirou. Entre de novo para continuar."
  if (status === 429) return "Muitas perguntas em sequência. Aguarde um instante e tente de novo."
  return MSG_GENERICA
}

let contador = 0
const idTemporario = (prefixo: string) => `${prefixo}-${Date.now()}-${contador++}`

export interface OpcoesChat {
  conversaInicial?: Conversa
  /**
   * Chamado quando o servidor cria/atualiza a conversa. `atual` é falso se o usuário já
   * trocou de conversa enquanto o stream seguia (aí só a lista lateral deve ser atualizada).
   */
  aoConversa?: (conversa: ResumoConversa, atual: boolean) => void
  aoFim?: (mensagem: Mensagem, atual: boolean) => void
}

export function useChat({ conversaInicial, aoConversa, aoFim }: OpcoesChat) {
  const [estado, dispatch] = React.useReducer(reducerChat, conversaInicial, estadoDaConversa)
  // Identifica o envio "vigente": eventos de envios antigos (conversa trocada) são ignorados
  const execucao = React.useRef(0)
  const controlador = React.useRef<AbortController | null>(null)

  const ocupado = estado.status !== "ocioso"
  const conversaId = estado.conversaId

  const enviar = React.useCallback(
    async (pergunta: string) => {
      const texto = pergunta.trim()
      if (texto === "" || ocupado) return

      const minha = ++execucao.current
      const atual = () => minha === execucao.current
      const abort = new AbortController()
      controlador.current = abort

      dispatch({ tipo: "enviar", pergunta: texto, idTemporario: idTemporario("tmp"), agora: new Date().toISOString() })

      const corpo: CorpoChat = { pergunta: texto, ...(conversaId ? { conversaId } : {}) }
      let terminou = false
      try {
        const resposta = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
          signal: abort.signal,
        })
        if (!resposta.ok || !resposta.body) {
          if (atual()) dispatch({ tipo: "falha", mensagem: mensagemDeErroHttp(resposta.status) })
          return
        }
        for await (const evento of lerEventosChat(resposta.body)) {
          if (evento.tipo === "conversa") aoConversa?.(evento.conversa, atual())
          if (evento.tipo === "fim") aoFim?.(evento.mensagem, atual())
          if (evento.tipo === "fim" || evento.tipo === "erro") terminou = true
          if (atual()) dispatch({ tipo: "evento", evento })
        }
        // O stream fechou sem `fim` nem `erro`: conexão cortada no meio
        if (!terminou && atual()) dispatch({ tipo: "falha", mensagem: "A resposta foi interrompida. Tente de novo." })
      } catch (erro) {
        const abortou = erro instanceof DOMException && erro.name === "AbortError"
        if (!abortou && atual()) dispatch({ tipo: "falha", mensagem: MSG_GENERICA })
      }
    },
    [ocupado, conversaId, aoConversa, aoFim],
  )

  /** Botão "Parar": corta o stream e mantém o que já chegou. */
  const parar = React.useCallback(() => {
    controlador.current?.abort()
    dispatch({ tipo: "interromper", idTemporario: idTemporario("parcial"), agora: new Date().toISOString() })
  }, [])

  /** "Tentar de novo": descarta a pergunta que falhou e envia de novo. */
  const tentarDeNovo = React.useCallback(
    (pergunta: string) => {
      dispatch({ tipo: "descartar-ultima-pergunta" })
      void enviar(pergunta)
    },
    [enviar],
  )

  /** Nova conversa: esquece o estado e ignora qualquer stream ainda em andamento. */
  const reiniciar = React.useCallback(() => {
    execucao.current++
    dispatch({ tipo: "reiniciar" })
  }, [])

  return { estado, ocupado, enviar, parar, tentarDeNovo, reiniciar }
}
