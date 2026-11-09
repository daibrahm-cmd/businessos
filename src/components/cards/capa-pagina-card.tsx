// Card da capa de uma seção: título, status, quem atualizou, resumo, data e tags.
import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { Status } from "@/lib/content/types"

import { StatusBadge } from "./status-badge"
import { autorLegivel, formatarDataExtensa, nuncaSalvo } from "./valores"

export interface CapaPaginaCardProps {
  href: string
  titulo: string
  status: Status
  resumo: string | null
  tags: string[]
  /** ISO 8601; a data-época (1970) significa "nunca salvo". */
  atualizadoEm: string
  /** "humano" ou "agente:<nome>". */
  autor: string
}

export function CapaPaginaCard({ href, titulo, status, resumo, tags, atualizadoEm, autor }: CapaPaginaCardProps) {
  const porAgente = autor.startsWith("agente:") && !nuncaSalvo(atualizadoEm)

  return (
    <Link
      href={href}
      className="group/capa block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-3 py-4 transition-colors group-hover/capa:bg-accent/50 motion-reduce:transition-none">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4">
          <h3 className="min-w-0 flex-1 basis-32 text-lg leading-snug font-semibold break-words">{titulo}</h3>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={status} />
            {porAgente && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Sparkles aria-hidden className="size-3" />
                {autorLegivel(autor)}
              </span>
            )}
          </div>
        </div>

        <p
          className={
            resumo
              ? "line-clamp-3 px-4 text-sm leading-relaxed text-muted-foreground group-data-[modo=lista]/colecao:line-clamp-1"
              : "px-4 text-sm text-muted-foreground italic"
          }
        >
          {resumo ?? "Sem resumo ainda."}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 text-xs text-muted-foreground">
          <span>{nuncaSalvo(atualizadoEm) ? "Ainda não editado" : `Atualizado em ${formatarDataExtensa(atualizadoEm)}`}</span>
          {tags.length > 0 && (
            <span className="flex flex-wrap gap-x-2">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </span>
          )}
        </div>
      </Card>
    </Link>
  )
}
