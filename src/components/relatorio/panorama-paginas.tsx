// Painel de números de um conjunto de páginas (Início e índices de seção): completude média e contagem por status.
import { Anel, Bloco, CARD, Indicador, ROTULO } from "@/components/relatorio/pecas"
import type { Status } from "@/lib/content/types"

export interface PanoramaPaginasProps {
  paginas: ReadonlyArray<{ status: Status; completude: number }>
}

export function PanoramaPaginas({ paginas }: PanoramaPaginasProps) {
  const total = paginas.length
  const media = total ? Math.round(paginas.reduce((soma, p) => soma + p.completude, 0) / total) : 0
  const validadas = paginas.filter((p) => p.status === "validado").length
  const emAndamento = paginas.filter((p) => p.status === "rascunho" || p.status === "em-validacao").length
  const vazias = paginas.filter((p) => p.status === "vazio").length

  return (
    <Bloco etiqueta="Panorama">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${CARD} flex items-center gap-4`}>
          <Anel percentual={media} />
          <div className="space-y-1">
            <p className={ROTULO}>Completude</p>
            <p className="text-4xl leading-none font-bold tabular-nums">
              {media}
              <span className="text-base font-medium text-muted-foreground">%</span>
            </p>
          </div>
        </div>
        <Indicador rotulo="Validadas" valor={String(validadas)} sufixo={`de ${total}`} />
        <Indicador rotulo="Em andamento" valor={String(emAndamento)} />
        <Indicador rotulo="Vazias" valor={String(vazias)} />
      </div>
    </Bloco>
  )
}
