// Card de uma seção na home: progresso, contagem por status, próxima página e lista de páginas.
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { hrefDaSecao, type PaginaNav, type SecaoNav, type SecaoSlug } from "@/lib/content/navigation"
import type { Status } from "@/lib/content/types"

import { StatusBadge } from "./status-badge"

export interface PaginaDaSecao {
  pagina: PaginaNav
  href: string
  status: Status
  /** Percentual 0–100. */
  completude: number
  atualizadoEm: string
}

export interface SectionCardProps {
  secao: SecaoNav
  paginas: PaginaDaSecao[]
}

// Singular/plural de cada status na contagem ("2 validadas · 1 vazia")
const ROTULO_CONTAGEM: Record<Status, [string, string]> = {
  validado: ["validada", "validadas"],
  "em-validacao": ["em validação", "em validação"],
  rascunho: ["rascunho", "rascunhos"],
  vazio: ["vazia", "vazias"],
}
const ORDEM_CONTAGEM: readonly Status[] = ["validado", "em-validacao", "rascunho", "vazio"]

function textoContagem(paginas: PaginaDaSecao[]): string {
  return ORDEM_CONTAGEM.map((status) => {
    const n = paginas.filter((p) => p.status === status).length
    if (n === 0) return null
    return `${n} ${ROTULO_CONTAGEM[status][n === 1 ? 0 : 1]}`
  })
    .filter(Boolean)
    .join(" · ")
}

export function SectionCard({ secao, paginas }: SectionCardProps) {
  const iniciadas = paginas.filter((p) => p.status !== "vazio").length
  const progresso = paginas.length ? Math.round((100 * iniciadas) / paginas.length) : 0
  // Próxima: primeira página vazia ou em rascunho (RF-08)
  const proxima = paginas.find((p) => p.status === "vazio" || p.status === "rascunho")
  const hrefSecao = hrefDaSecao(secao.slug as SecaoSlug)

  return (
    <Card className="h-full gap-4 py-4">
      <CardHeader className="gap-1 px-4">
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {paginas.length} {paginas.length === 1 ? "página" : "páginas"}
        </p>
        <h3 className="text-base font-semibold">
          <Link
            href={hrefSecao}
            className="rounded-sm outline-none hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {secao.nome}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">{secao.descricao}</p>
      </CardHeader>

      <CardContent className="space-y-4 px-4">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
            <span>{textoContagem(paginas)}</span>
            <span className="tabular-nums">{progresso}%</span>
          </div>
          <Progress value={progresso} aria-label={`Páginas iniciadas em ${secao.nome}`} />
        </div>

        {proxima && (
          <Link
            href={proxima.href}
            className="flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none md:min-h-9"
          >
            <span className="min-w-0 truncate">
              <span className="text-muted-foreground">Próxima: </span>
              <span className="font-medium">{proxima.pagina.titulo}</span>
            </span>
            <ArrowRight aria-hidden className="size-4 shrink-0" />
          </Link>
        )}

        <ul className="-mx-2 space-y-0.5">
          {paginas.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-2 text-sm transition-colors outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none md:min-h-8"
              >
                <span className="min-w-0 truncate">{p.pagina.titulo}</span>
                <StatusBadge status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
