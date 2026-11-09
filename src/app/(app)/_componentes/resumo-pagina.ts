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
  /** Primeiro texto preenchido da página (para a capa da seção); null se ainda não há nenhum. */
  resumo: string | null
  tags: string[]
  /** "humano" ou "agente:<nome>". */
  autor: string
}

const LIMITE_RESUMO = 240

/** Primeiro campo de texto preenchido (longo antes de curto), cortado em 240 caracteres. */
function resumoDoDocumento(doc: ContentDoc): string | null {
  const def = obterDefinicao(doc.id)
  for (const tipo of ["texto-longo", "texto-curto"] as const) {
    for (const campo of def.campos) {
      const valor = doc.campos[campo.nome]
      if (campo.tipo === tipo && typeof valor === "string" && valor.trim() !== "") {
        const texto = valor.trim().replace(/\s+/g, " ")
        return texto.length > LIMITE_RESUMO ? `${texto.slice(0, LIMITE_RESUMO).trimEnd()}…` : texto
      }
    }
  }
  return null
}

export function resumirPagina(doc: ContentDoc): ResumoPagina {
  return {
    pagina: obterPagina(doc.id).pagina,
    href: hrefDoDocumento(doc.id),
    status: doc.status,
    completude: calcularCompletude(doc, obterDefinicao(doc.id)).percentual,
    atualizadoEm: doc.atualizado_em,
    resumo: resumoDoDocumento(doc),
    tags: doc.tags,
    autor: doc.atualizado_por,
  }
}
