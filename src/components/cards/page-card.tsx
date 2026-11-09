// Card-link de uma página (índice da seção): ícone, título, descrição, status e completude.
import Link from "next/link"

import { ICONES } from "@/components/layout/icones"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { NomeIcone } from "@/lib/content/navigation"
import type { Status } from "@/lib/content/types"
import { cn } from "@/lib/utils"

import { StatusBadge } from "./status-badge"
import { formatarDataCurta, nuncaSalvo } from "./valores"

export interface PageCardProps {
  href: string
  titulo: string
  descricao: string
  status: Status
  /** Percentual 0–100. */
  completude: number
  /** ISO 8601; a data-época (1970) significa "nunca salvo". */
  atualizadoEm: string
  icone?: NomeIcone
}

export function PageCard({ href, titulo, descricao, status, completude, atualizadoEm, icone }: PageCardProps) {
  const Icone = icone ? ICONES[icone] : null

  return (
    <Link
      href={href}
      className="group/page-card block h-full rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <Card
        className={cn(
          "h-full gap-3 py-4 transition-colors group-hover/page-card:bg-accent/50 motion-reduce:transition-none",
          // Em lista (dentro de CardCollection), o card fica mais baixo
          "group-data-[modo=lista]/colecao:gap-2",
        )}
      >
        <div className="flex items-start gap-3 px-4">
          {Icone && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
              <Icone aria-hidden className="size-4" />
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            {/* Selo acima do título: em cards estreitos ele não estoura a borda */}
            <StatusBadge status={status} />
            <h3 className="text-base leading-snug font-semibold break-words">{titulo}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{descricao}</p>
          </div>
        </div>
        <div className="mt-auto space-y-2 px-4">
          <Progress value={completude} className="h-1" aria-label={`Completude de ${titulo}`} />
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {nuncaSalvo(atualizadoEm)
                ? "Ainda não editado"
                : `Atualizado em ${formatarDataCurta(atualizadoEm)}`}
            </span>
            <span className="tabular-nums">{completude}%</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
