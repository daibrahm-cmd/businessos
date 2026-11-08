"use client"

// Coleção de cards com cabeçalho e seletor "Grade / Lista" (preferência lembrada por chave).
// Os cards filhos leem o modo atual por contexto com useModoColecao().
import * as React from "react"

import { useModoVisualizacao } from "@/hooks/use-modo-visualizacao"
import type { ModoVisualizacao } from "@/lib/content/types"
import { cn } from "@/lib/utils"

import { ViewModeSelect } from "./view-mode-select"

const ModoColecaoContext = React.createContext<ModoVisualizacao>("grade")

/** Modo da coleção mais próxima ("grade" fora de uma CardCollection). */
export function useModoColecao(): ModoVisualizacao {
  return React.useContext(ModoColecaoContext)
}

export interface CardCollectionProps {
  /** Chave da preferência no localStorage (businessos:modo:<chave>). */
  chavePreferencia: string
  titulo?: string
  descricao?: string
  /** Ações extras à direita do cabeçalho (ex.: botão "Adicionar"). */
  acoes?: React.ReactNode
  /** Exibido no lugar da grade quando não há filhos. */
  vazio?: React.ReactNode
  modoInicial?: ModoVisualizacao
  /** Conteúdo entre o cabeçalho e os cards (ex.: resumos da coleção). */
  topo?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export function CardCollection({
  chavePreferencia,
  titulo,
  descricao,
  acoes,
  vazio,
  modoInicial,
  topo,
  className,
  children,
}: CardCollectionProps) {
  const [modo, setModo] = useModoVisualizacao(chavePreferencia, modoInicial ?? "grade")
  const filhos = React.Children.toArray(children)
  const idTitulo = React.useId()

  return (
    <section aria-labelledby={titulo ? idTitulo : undefined} className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-56 space-y-1">
          {titulo && (
            <h2 id={idTitulo} className="text-base font-semibold">
              {titulo}
            </h2>
          )}
          {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {acoes}
          <ViewModeSelect value={modo} onValueChange={setModo} />
        </div>
      </div>

      {topo}

      <ModoColecaoContext.Provider value={modo}>
        {filhos.length === 0 ? (
          (vazio ?? null)
        ) : (
          <div
            data-modo={modo}
            className={cn(
              // group/colecao: cards podem ajustar o visual com group-data-[modo=lista]/colecao:*
              "group/colecao",
              modo === "grade"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-2",
            )}
          >
            {filhos}
          </div>
        )}
      </ModoColecaoContext.Provider>
    </section>
  )
}
