// Chips discretos com as fontes de uma resposta. Documentos do BusinessOS viram link para a página.
import Link from "next/link"
import { FileText, MessageSquare } from "lucide-react"

import { ehIdValido, hrefDoDocumento } from "@/lib/content/navigation"
import type { FonteResposta } from "@/lib/conversas/tipos"

const CLASSE_CHIP =
  "inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground"

export function FontesResposta({ fontes }: { fontes: FonteResposta[] }) {
  if (fontes.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Fontes</span>
      <ul className="contents">
        {fontes.map((fonte) => {
          const Icone = fonte.origemTipo === "documento" ? FileText : MessageSquare
          const conteudo = (
            <>
              <Icone aria-hidden className="size-3 shrink-0" />
              <span className="truncate">{fonte.titulo}</span>
            </>
          )
          const href =
            fonte.origemTipo === "documento" && ehIdValido(fonte.origemId) ? hrefDoDocumento(fonte.origemId) : null
          return (
            <li key={`${fonte.origemTipo}-${fonte.origemId}`} className="max-w-full">
              {href ? (
                <Link
                  href={href}
                  className={`${CLASSE_CHIP} outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50`}
                >
                  {conteudo}
                </Link>
              ) : (
                <span className={CLASSE_CHIP}>{conteudo}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
