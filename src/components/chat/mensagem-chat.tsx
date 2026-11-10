"use client"

// Uma mensagem da conversa. Usuário: balão à direita. Assistente: texto corrido à esquerda, sem balão,
// com barra de ações (copiar) e fontes.
import * as React from "react"
import { Check, Copy } from "lucide-react"

import { renderMarkdownSimples } from "@/lib/markdown/render-simples"
import type { Mensagem } from "@/lib/conversas/tipos"
import { cn } from "@/lib/utils"

import { FontesResposta } from "./fontes-resposta"

export function MensagemUsuario({ conteudo }: { conteudo: string }) {
  return (
    <div className="flex justify-end">
      {/* Destaque: Marinho/Grisalho suave no claro; Grisalho com texto Carvão no escuro */}
      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-accent-foreground">
        {conteudo}
      </p>
    </div>
  )
}

function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = React.useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sem permissão de área de transferência: não há o que fazer além de não confirmar
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={copiado ? "Resposta copiada" : "Copiar resposta"}
      className="grid size-11 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:size-8"
    >
      {copiado ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      <span role="status" className="sr-only">
        {copiado ? "Copiado" : ""}
      </span>
    </button>
  )
}

export function MensagemAssistente({ mensagem }: { mensagem: Pick<Mensagem, "conteudo" | "fontes"> }) {
  return (
    <div className="space-y-2">
      <div className="text-foreground [&_*]:leading-7">{renderMarkdownSimples(mensagem.conteudo)}</div>
      <div className="-ml-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <BotaoCopiar texto={mensagem.conteudo} />
        <FontesResposta fontes={mensagem.fontes} />
      </div>
    </div>
  )
}

/** Três pontinhos enquanto a primeira parte da resposta não chegou. */
export function Digitando({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-7 items-center gap-1", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-pulse rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </div>
  )
}

/** Resposta ainda chegando: texto parcial com cursor, ou só o "digitando". */
export function MensagemEmStream({ texto }: { texto: string }) {
  return (
    <div>
      {texto === "" ? (
        <Digitando />
      ) : (
        <div className="text-foreground [&_*]:leading-7">
          {renderMarkdownSimples(texto)}
          <span aria-hidden className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-foreground" />
        </div>
      )}
    </div>
  )
}
