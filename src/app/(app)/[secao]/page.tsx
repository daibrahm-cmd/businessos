// Índice de uma seção: um card por página, com status, completude e data da última edição.
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CardCollection } from "@/components/cards/card-collection"
import { CapaPaginaCard } from "@/components/cards/capa-pagina-card"
import { AppHeader } from "@/components/layout/app-header"
import { CabecalhoPagina } from "@/components/relatorio/cabecalho-pagina"
import { ErroConteudo } from "@/lib/content/errors"
import { ehSecaoValida, obterSecao } from "@/lib/content/navigation"
import { listarDocumentos } from "@/lib/content/servico"
import type { ContentDoc } from "@/lib/content/types"

import { PainelErroConteudo } from "../_componentes/painel-erro-conteudo"
import { resumirPagina } from "../_componentes/resumo-pagina"

// Slugs validados contra a navegação a cada requisição; sem generateStaticParams (D12).
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps<"/[secao]">): Promise<Metadata> {
  const { secao } = await params
  const nav = obterSecao(secao)
  return nav ? { title: nav.nome } : {}
}

export default async function SecaoPage({ params }: PageProps<"/[secao]">) {
  const { secao: slug } = await params
  if (!ehSecaoValida(slug)) notFound()
  const secao = obterSecao(slug)
  if (!secao) notFound()

  let documentos: ContentDoc[] | null = null
  let erroConteudo: ErroConteudo | null = null
  try {
    documentos = (await listarDocumentos()).filter((d) => d.secao === slug)
  } catch (erro) {
    if (!(erro instanceof ErroConteudo && erro.codigo === "CONTEUDO_INVALIDO")) throw erro
    console.error(`[${slug}] conteúdo inválido`, erro.message)
    erroConteudo = erro
  }

  return (
    <>
      <AppHeader trilha={[{ rotulo: "Início", href: "/" }, { rotulo: secao.nome }]} />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-10">
        <CabecalhoPagina
          eyebrow={`${secao.titulo} · ${secao.paginas.length} páginas`}
          titulo={secao.nome}
          descricao={secao.descricao}
        />

        {erroConteudo || !documentos ? (
          <PainelErroConteudo
            titulo="Há um arquivo de conteúdo inválido."
            mensagem={erroConteudo?.message ?? "Não foi possível ler as páginas."}
            detalhes={erroConteudo?.detalhes}
          />
        ) : (
          <CardCollection chavePreferencia={`secao:${slug}`}>
            {documentos.map((doc) => {
              const r = resumirPagina(doc)
              return (
                <CapaPaginaCard
                  key={doc.id}
                  href={r.href}
                  titulo={r.pagina.titulo}
                  status={r.status}
                  resumo={r.resumo}
                  tags={r.tags}
                  atualizadoEm={r.atualizadoEm}
                  autor={r.autor}
                />
              )
            })}
          </CardCollection>
        )}
      </div>
    </>
  )
}
