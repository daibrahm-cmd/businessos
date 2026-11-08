// Mini-cards com os indicadores calculados de uma coleção (contagem, soma, saldo).
import type { ResumoCalculado } from "@/lib/content/types"
import { formatarMoeda, formatarNumero } from "@/lib/format"

export interface CollectionSummaryProps {
  resumos: ResumoCalculado[]
}

/** Valor formatado; negativo leva o sinal tipográfico "−" (sem cor). */
function formatarResumo(resumo: ResumoCalculado): string {
  const absoluto = Math.abs(resumo.valor)
  const texto = resumo.formato === "moeda" ? formatarMoeda(absoluto) : formatarNumero(absoluto)
  return resumo.valor < 0 ? `−${texto}` : texto
}

export function CollectionSummary({ resumos }: CollectionSummaryProps) {
  if (resumos.length === 0) return null

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {resumos.map((resumo) => (
        <div key={resumo.rotulo} className="min-w-0 rounded-xl border bg-card px-4 py-3">
          <dt className="truncate text-xs text-muted-foreground">{resumo.rotulo}</dt>
          <dd className="truncate text-lg font-semibold tabular-nums">{formatarResumo(resumo)}</dd>
        </div>
      ))}
    </dl>
  )
}
