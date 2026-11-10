"use client"

// Chat completo: tela inicial (Principal) e conversa. Um único componente mantém o stream vivo
// quando a conversa nasce em /principal e a URL passa a /principal/[id] sem recarregar.
import * as React from "react"
import { usePathname } from "next/navigation"

import type { Conversa } from "@/lib/conversas/tipos"
import { cn } from "@/lib/utils"

import type { Atalho } from "./atalhos"
import { AtalhosSugeridos } from "./atalhos-sugeridos"
import { useConversas } from "./conversas-provider"
import { ListaMensagens } from "./lista-mensagens"
import { PromptArea } from "./prompt-area"
import { useChat } from "./use-chat"

export interface ChatProps {
  /** Conversa carregada do servidor (/principal/[id]). Ausente = tela Principal. */
  conversaInicial?: Conversa
}

export function Chat({ conversaInicial }: ChatProps) {
  const { registrar, tocar } = useConversas()
  const pathname = usePathname()
  const [rascunho, setRascunho] = React.useState("")
  const prompt = React.useRef<HTMLTextAreaElement>(null)

  const { estado, ocupado, enviar, parar, tentarDeNovo, reiniciar } = useChat({
    conversaInicial,
    aoConversa: (conversa, atual) => {
      registrar(conversa)
      // Troca a URL sem recarregar nem remontar: o stream continua nesta mesma instância
      const destino = `/principal/${conversa.id}`
      if (atual && window.location.pathname !== destino) window.history.replaceState(null, "", destino)
    },
    // Sobe a conversa para o topo da lista com a data da última resposta (mesmo se o usuário já trocou de tela)
    aoFim: (mensagem) => tocar(mensagem.conversaId, mensagem.criadoEm),
  })

  // "Nova conversa" navega de volta a /principal enquanto esta instância ainda está montada
  const caminhoAnterior = React.useRef(pathname)
  React.useEffect(() => {
    if (caminhoAnterior.current === pathname) return
    caminhoAnterior.current = pathname
    if (pathname === "/principal") reiniciar()
  }, [pathname, reiniciar])

  const enviarRascunho = () => {
    const texto = rascunho
    setRascunho("")
    void enviar(texto)
  }

  const escolherAtalho = (atalho: Atalho) => {
    setRascunho(atalho.prompt)
    prompt.current?.focus()
  }

  const vazio = estado.mensagens.length === 0 && !ocupado && !estado.erro

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {vazio ? null : (
        <ListaMensagens
          mensagens={estado.mensagens}
          textoParcial={estado.textoParcial}
          status={estado.status}
          erro={estado.erro}
          onTentarDeNovo={estado.ultimaPergunta ? () => tentarDeNovo(estado.ultimaPergunta ?? "") : undefined}
        />
      )}

      {/* Mesma posição na árvore nos dois modos: o textarea não perde o foco quando a conversa começa */}
      <div
        className={cn(
          "shrink-0 px-4 md:px-6",
          vazio ? "flex flex-1 flex-col justify-center pb-16" : "pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
      >
        <div className="mx-auto w-full max-w-3xl">
          {vazio && (
            <h1 className="mb-8 text-center font-display text-4xl leading-tight font-semibold tracking-tight text-balance md:text-5xl">
              O que você quer destravar hoje?
            </h1>
          )}
          <PromptArea
            valor={rascunho}
            onValorChange={setRascunho}
            onEnviar={enviarRascunho}
            transmitindo={ocupado}
            onParar={parar}
            textareaRef={prompt}
            placeholder={vazio ? "Pergunte sobre o seu negócio" : "Responda ou aprofunde"}
          />
          {vazio && <AtalhosSugeridos className="mt-4" onEscolher={escolherAtalho} />}
        </div>
      </div>
    </div>
  )
}
