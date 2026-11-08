// Converte um documento no resumo usado pelos cards da home e dos índices de seção.
import { calcularCompletude } from "@/lib/content/completude"
import { hrefDoDocumento, obterPagina, type PaginaNav } from "@/lib/content/navigation"
import { obterDefinicao } from "@/lib/content/schemas"
import type { ContentDoc, Status } from "@/lib/content/types"

export interface ResumoPagina {
  pagina: PaginaNav
  href: string
  status: Status
  /** Percentual 0–100. */
  completude: number
  atualizadoEm: string
}

export function resumirPagina(doc: ContentDoc): ResumoPagina {
  return {
    pagina: obterPagina(doc.id).pagina,
    href: hrefDoDocumento(doc.id),
    status: doc.status,
    completude: calcularCompletude(doc, obterDefinicao(doc.id)).percentual,
    atualizadoEm: doc.atualizado_em,
  }
}
