// Briefing: análise das suas respostas feita pelo Claude local.
import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"
import { CabecalhoPagina } from "@/components/relatorio/cabecalho-pagina"
import { completudeGeral, lerBriefing } from "@/lib/briefing/briefing"
import { formatarDataHora } from "@/lib/format"

import { BotaoGerar } from "./botao-gerar"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Briefing" }

export default async function BriefingPage() {
  const [briefing, completudeAtual] = await Promise.all([lerBriefing(), completudeGeral()])

  return (
    <>
      <AppHeader trilha={[{ rotulo: "Briefing" }]} />
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-6 md:px-8 md:py-10">
        <CabecalhoPagina
          eyebrow="Análise do Claude"
          titulo="Briefing"
          descricao="O Claude lê as respostas de todas as páginas e monta um briefing: resumo, a conta que fecha (ou não), contradições, o que falta responder e os próximos passos."
        />

        <div className="flex flex-wrap items-center gap-3">
          <BotaoGerar temBriefing={!!briefing} />
          <span className="text-sm text-muted-foreground">Preenchimento atual: {completudeAtual}%</span>
        </div>

        {completudeAtual < 30 && (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Poucas respostas ainda. O briefing vai funcionar, mas vai ser sobretudo uma lista do que falta responder.
          </p>
        )}

        {briefing ? (
          <article className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Gerado em {formatarDataHora(briefing.geradoEm)} · com {briefing.completude}% de preenchimento
            </p>
            {/* Texto em Markdown exibido como está (sem renderizador, para não somar dependência) */}
            <pre className="font-sans text-sm leading-relaxed break-words whitespace-pre-wrap">{briefing.texto}</pre>
          </article>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum briefing gerado ainda.</p>
        )}
      </div>
    </>
  )
}
