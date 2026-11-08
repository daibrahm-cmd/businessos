// Início: visão geral do negócio com um card por seção (progresso, contagem por status e próxima página).
import type { Metadata } from "next"

import { CardCollection } from "@/components/cards/card-collection"
import { SectionCard } from "@/components/cards/section-card"
import { AppHeader } from "@/components/layout/app-header"
import { ErroConteudo } from "@/lib/content/errors"
import { NAVEGACAO } from "@/lib/content/navigation"
import { listarDocumentos } from "@/lib/content/servico"
import type { ContentDoc } from "@/lib/content/types"

import { PainelErroConteudo } from "./_componentes/painel-erro-conteudo"
import { resumirPagina } from "./_componentes/resumo-pagina"

export const dynamic = "force-dynamic"

export const metadata: Metadata = { title: "Início" }

/** Lê os 12 documentos; arquivo inválido vira painel de erro em vez de quebrar a página. */
async function carregar(): Promise<{ documentos: ContentDoc[] } | { erro: ErroConteudo }> {
  try {
    return { documentos: await listarDocumentos() }
  } catch (erro) {
    if (erro instanceof ErroConteudo && erro.codigo === "CONTEUDO_INVALIDO") {
      console.error("[inicio] conteúdo inválido", erro.message)
      return { erro }
    }
    throw erro
  }
}

export default async function InicioPage() {
  const resultado = await carregar()

  return (
    <>
      <AppHeader trilha={[{ rotulo: "Início" }]} />
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Visão geral</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o que já está claro no seu negócio e o que falta decidir.
          </p>
        </div>

        {"erro" in resultado ? (
          <PainelErroConteudo
            titulo="Há um arquivo de conteúdo inválido."
            mensagem={resultado.erro.message}
            detalhes={resultado.erro.detalhes}
          />
        ) : (
          <CardCollection chavePreferencia="inicio">
            {NAVEGACAO.map((secao) => (
              <SectionCard
                key={secao.slug}
                secao={secao}
                paginas={resultado.documentos.filter((d) => d.secao === secao.slug).map(resumirPagina)}
              />
            ))}
          </CardCollection>
        )}
      </div>
    </>
  )
}
