// Início: visão geral do negócio com um card por seção (progresso, contagem por status e próxima página).
import type { Metadata } from "next"

import { PageCard } from "@/components/cards/page-card"
import { AppHeader } from "@/components/layout/app-header"
import { CabecalhoPagina } from "@/components/relatorio/cabecalho-pagina"
import { Bloco } from "@/components/relatorio/pecas"
import { PanoramaPaginas } from "@/components/relatorio/panorama-paginas"
import { ErroConteudo } from "@/lib/content/errors"
import { ESTAGIO_ATUAL, hrefDaSecao, NAVEGACAO, ROTULO_ESTAGIO, type SecaoSlug } from "@/lib/content/navigation"
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
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-10">
        <CabecalhoPagina
          eyebrow={`BusinessOS · ${ROTULO_ESTAGIO[ESTAGIO_ATUAL]}`}
          titulo="Visão geral"
          descricao="Acompanhe o que já está claro no seu negócio e o que falta decidir."
        />

        {"erro" in resultado ? (
          <PainelErroConteudo
            titulo="Há um arquivo de conteúdo inválido."
            mensagem={resultado.erro.message}
            detalhes={resultado.erro.detalhes}
          />
        ) : (
          <>
            <PanoramaPaginas paginas={resultado.documentos.map(resumirPagina)} />
            {NAVEGACAO.map((secao) => {
              const paginas = resultado.documentos.filter((d) => d.secao === secao.slug).map(resumirPagina)
              const iniciadas = paginas.filter((p) => p.status !== "vazio").length
              return (
                <Bloco
                  key={secao.slug}
                  etiqueta={secao.nome}
                  detalhe={`${iniciadas} de ${paginas.length} iniciadas`}
                  descricao={secao.descricao}
                  href={hrefDaSecao(secao.slug as SecaoSlug)}
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {paginas.map((r) => (
                      <PageCard
                        key={r.href}
                        href={r.href}
                        titulo={r.pagina.titulo}
                        descricao={r.pagina.descricao}
                        status={r.status}
                        completude={r.completude}
                        atualizadoEm={r.atualizadoEm}
                        icone={r.pagina.icone}
                      />
                    ))}
                  </div>
                </Bloco>
              )
            })}
          </>
        )}
      </div>
    </>
  )
}
