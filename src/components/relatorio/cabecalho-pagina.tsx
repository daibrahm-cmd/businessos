// Cabeçalho padrão das telas: etiqueta, título em Cormorant Garamond (único uso da fonte), descrição e ações.
import * as React from "react"

export interface CabecalhoPaginaProps {
  eyebrow?: string
  titulo: string
  descricao?: string
  /** Botões e selos logo abaixo da descrição. */
  acoes?: React.ReactNode
  /** Informações extras abaixo das ações (data de atualização, relacionadas…). */
  children?: React.ReactNode
}

export function CabecalhoPagina({ eyebrow, titulo, descricao, acoes, children }: CabecalhoPaginaProps) {
  return (
    // zoom 0.9: reduz o cabeçalho inteiro (título, ações, datas, relacionadas) em 10%, de forma proporcional.
    <header className="space-y-5 [zoom:0.9]">
      {eyebrow && (
        <p className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-[40.8px] leading-[0.95] font-semibold tracking-tight break-words md:text-[61.2px]">
        {titulo}
      </h1>
      {descricao && <p className="max-w-2xl text-[12.65px] text-primary md:text-[14.95px]">{descricao}</p>}
      {acoes && <div className="flex flex-wrap items-center gap-3">{acoes}</div>}
      {children}
    </header>
  )
}
