"use client"

// Área de prompt em pílula: textarea que cresce, Enter envia, Shift+Enter quebra linha.
// Durante o stream o botão vira "Parar".
import * as React from "react"
import { ArrowUp, Square } from "lucide-react"

import { cn } from "@/lib/utils"

/** Altura máxima antes de aparecer rolagem interna (~8 linhas). */
const ALTURA_MAXIMA_PX = 200

export interface PromptAreaProps {
  valor: string
  onValorChange: (valor: string) => void
  onEnviar: () => void
  /** Há uma resposta chegando: o botão passa a parar o stream. */
  transmitindo?: boolean
  onParar?: () => void
  placeholder?: string
  /** Ref do textarea (para os atalhos sugeridos devolverem o foco). */
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
  className?: string
}

export function PromptArea({
  valor,
  onValorChange,
  onEnviar,
  transmitindo = false,
  onParar,
  placeholder = "Pergunte sobre o seu negócio",
  textareaRef,
  className,
}: PromptAreaProps) {
  const alternativo = React.useRef<HTMLTextAreaElement | null>(null)
  const ref = textareaRef ?? alternativo
  const podeEnviar = valor.trim() !== "" && !transmitindo

  // Cresce com o conteúdo (field-sizing ainda não existe em todos os navegadores)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, ALTURA_MAXIMA_PX)}px`
  }, [valor, ref])

  const aoTeclar = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // isComposing: não envia ao confirmar acento/IME com Enter
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (podeEnviar) onEnviar()
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (podeEnviar) onEnviar()
      }}
      className={cn(
        "flex items-end gap-2 rounded-[1.75rem] border border-input bg-card py-2 pr-2 pl-5 shadow-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40",
        className,
      )}
    >
      <label htmlFor="prompt-chat" className="sr-only">
        Sua mensagem
      </label>
      <textarea
        id="prompt-chat"
        ref={ref}
        rows={1}
        value={valor}
        onChange={(e) => onValorChange(e.target.value)}
        onKeyDown={aoTeclar}
        placeholder={placeholder}
        // 16px no mobile evita o zoom automático do iOS ao focar
        className="field-sizing-fixed min-h-11 flex-1 resize-none self-center bg-transparent py-2.5 text-base leading-6 outline-none placeholder:text-muted-foreground md:text-sm"
      />
      {transmitindo ? (
        <button
          type="button"
          onClick={onParar}
          aria-label="Parar resposta"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-[#B0C2C2] dark:text-[#373634] dark:hover:bg-[#B0C2C2]/85"
        >
          <Square aria-hidden className="size-3.5 fill-current" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!podeEnviar}
          aria-label="Enviar mensagem"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#B0C2C2] dark:text-[#373634] dark:hover:bg-[#B0C2C2]/85"
        >
          <ArrowUp aria-hidden className="size-4" />
        </button>
      )}
    </form>
  )
}
