// Passo a passo: onboarding com uma pergunta por vez (Founder e Direção) e revisão no fim.
import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"
import { PassoAPasso, type PaginaOnboarding } from "@/components/onboarding/passo-a-passo"
import { obterPagina } from "@/lib/content/navigation"
import { obterDefinicao } from "@/lib/content/schemas"
import { listarDocumentos } from "@/lib/content/servico"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Passo a passo" }

/** Seções perguntadas no onboarding (Validação e Caixa dependem de dados do negócio rodando). */
const SECOES = ["founder", "direcao"]

export default async function ComecarPage() {
  const documentos = (await listarDocumentos()).filter((d) => SECOES.includes(d.secao))

  const paginas: PaginaOnboarding[] = documentos.map((d) => {
    const nav = obterPagina(d.id)
    return {
      id: d.id,
      titulo: nav.pagina.titulo,
      secao: nav.secao.nome,
      campos: obterDefinicao(d.id).campos,
      valores: d.campos,
    }
  })

  return (
    <>
      <AppHeader trilha={[{ rotulo: "Passo a passo" }]} />
      <div className="px-4 py-6 md:px-8 md:py-10">
        <PassoAPasso paginas={paginas} />
      </div>
    </>
  )
}
