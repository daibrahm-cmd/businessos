// Peças visuais compartilhadas pelo relatório, pelo Início e pelos índices de seção.
import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

/** Etiqueta de seção: pílula cheia, no estilo dos rótulos do quadro de referência. */
export function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="inline-flex w-fit items-center rounded-md bg-primary px-3 py-1 text-xs font-semibold tracking-[0.14em] text-primary-foreground uppercase">
      {children}
    </h2>
  )
}

/** Moldura tracejada que agrupa um bloco do relatório. */
export function Bloco({
  etiqueta,
  detalhe,
  descricao,
  href,
  children,
}: {
  etiqueta: string
  detalhe?: string
  descricao?: string
  /** Quando informado, a etiqueta vira link (ex.: da home para o índice da seção). */
  href?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-dashed p-4 md:p-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {href ? (
            <Link href={href} className="rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <Etiqueta>{etiqueta}</Etiqueta>
            </Link>
          ) : (
            <Etiqueta>{etiqueta}</Etiqueta>
          )}
          {detalhe && <span className="text-xs text-muted-foreground">{detalhe}</span>}
        </div>
        {descricao && <p className="max-w-2xl text-[10px] text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </section>
  )
}

export const CARD = "rounded-xl bg-card p-4 ring-1 ring-foreground/10"
export const ROTULO = "text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase"

/** Anel de progresso (0–100). */
export function Anel({ percentual }: { percentual: number }) {
  const raio = 42
  const circunferencia = 2 * Math.PI * raio
  return (
    <svg viewBox="0 0 100 100" className="size-20 shrink-0 -rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={raio} fill="none" strokeWidth="9" className="stroke-foreground/15" />
      <circle
        cx="50"
        cy="50"
        r={raio}
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        className="stroke-primary"
        strokeDasharray={`${(circunferencia * percentual) / 100} ${circunferencia}`}
      />
    </svg>
  )
}

/** Número grande com rótulo (painel de indicadores). */
export function Indicador({ rotulo, valor, sufixo }: { rotulo: string; valor: string; sufixo?: string }) {
  return (
    <div className={cn(CARD, "space-y-2")}>
      <p className={ROTULO}>{rotulo}</p>
      <p className="text-4xl leading-none font-bold tracking-tight tabular-nums break-words md:text-5xl">
        {valor}
        {sufixo && <span className="ml-1 text-base font-medium text-muted-foreground">{sufixo}</span>}
      </p>
    </div>
  )
}

