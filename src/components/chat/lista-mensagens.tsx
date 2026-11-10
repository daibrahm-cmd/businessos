"use client"

// Área rolável da conversa: mensagens, resposta em stream, erro amigável e rolagem automática.
// A rolagem acompanha o stream só enquanto a pessoa está perto do fim (se ela subir para reler, não puxamos de volta).
import * as React from "react"
import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Mensagem } from "@/lib/conversas/tipos"

import type { StatusChat } from "./mensagens-reducer"
import { MensagemAssistente, MensagemEmStream, MensagemUsuario } from "./mensagem-chat"

const MARGEM_DO_FIM_PX = 96

export interface ListaMensagensProps {
  mensagens: Mensagem[]
  textoParcial: string
  status: StatusChat
  erro: string | null
  onTentarDeNovo?: () => void
}

export function ListaMensagens({ mensagens, textoParcial, status, erro, onTentarDeNovo }: ListaMensagensProps) {
  const rolagem = React.useRef<HTMLDivElement>(null)
  const noFim = React.useRef(true)

  const aoRolar = () => {
    const el = rolagem.current
    if (!el) return
    noFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < MARGEM_DO_FIM_PX
  }

  // Nova mensagem do usuário sempre leva ao fim; o restante só se já estávamos no fim
  const ultima = mensagens[mensagens.length - 1]
  React.useEffect(() => {
    if (ultima?.papel === "usuario") noFim.current = true
  }, [ultima])

  React.useEffect(() => {
    const el = rolagem.current
    if (el && noFim.current) el.scrollTop = el.scrollHeight
  }, [mensagens, textoParcial, status, erro])

  const ocupado = status !== "ocioso"

  return (
    <div ref={rolagem} onScroll={aoRolar} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
        <ol className="contents" aria-label="Conversa">
          {mensagens.map((m) => (
            <li key={m.id}>
              {m.papel === "usuario" ? <MensagemUsuario conteudo={m.conteudo} /> : <MensagemAssistente mensagem={m} />}
            </li>
          ))}
        </ol>

        {ocupado && (
          // aria-live: leitores de tela recebem a resposta conforme ela chega
          <div aria-live="polite" aria-busy={status === "transmitindo"}>
            <p role="status" className="sr-only">
              {textoParcial === "" ? "Digitando…" : "Respondendo…"}
            </p>
            <MensagemEmStream texto={textoParcial} />
          </div>
        )}

        {erro && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center"
          >
            <TriangleAlert aria-hidden className="size-4 shrink-0 text-destructive" />
            <p className="flex-1">{erro}</p>
            {onTentarDeNovo && (
              <Button variant="outline" className="h-11 md:h-8" onClick={onTentarDeNovo}>
                Tentar de novo
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
