// Página do documento: relatório de leitura; a edição abre em um modal (Server Action ligada ao editor).
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AppHeader } from "@/components/layout/app-header"
import { PaginaRelatorio } from "@/components/relatorio/pagina-relatorio"
import { salvarDocumento } from "@/lib/content/actions"
import { gerarRelatorioAction, pedirIAAction } from "@/lib/ia/actions"
import { calcularResumos } from "@/lib/content/resumos"
import { ErroConteudo } from "@/lib/content/errors"
import { hrefDaSecao, montarId, obterPagina, separarId } from "@/lib/content/navigation"
import { obterDefinicao } from "@/lib/content/schemas"
import { lerDocumento } from "@/lib/content/servico"
import type { ContentDoc, ResumoCalculado } from "@/lib/content/types"

import { PainelErroConteudo } from "../../_componentes/painel-erro-conteudo"

// Conteúdo muda fora do app (agentes); sem generateStaticParams (D12).
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps<"/[secao]/[pagina]">): Promise<Metadata> {
  const { secao, pagina } = await params
  const id = montarId(secao, pagina)
  if (!id) return {}
  const nav = obterPagina(id)
  return { title: `${nav.pagina.titulo} · ${nav.secao.nome}` }
}

export default async function PaginaEditavel({ params }: PageProps<"/[secao]/[pagina]">) {
  const { secao: slugSecao, pagina: slugPagina } = await params
  const id = montarId(slugSecao, slugPagina)
  if (!id) notFound()

  const { secao, pagina } = obterPagina(id)
  const trilha = [
    { rotulo: "Início", href: "/" },
    { rotulo: secao.nome, href: hrefDaSecao(separarId(id).secao) },
    { rotulo: pagina.titulo },
  ]

  let documento: ContentDoc
  try {
    documento = await lerDocumento(id)
  } catch (erro) {
    if (!(erro instanceof ErroConteudo && erro.codigo === "CONTEUDO_INVALIDO")) throw erro
    console.error(`[${id}] conteúdo inválido`, erro.message)
    // Sem editor: salvar por cima de um arquivo inválido apagaria o que precisa ser corrigido.
    return (
      <>
        <AppHeader trilha={trilha} />
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 md:px-8 md:py-8">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{secao.titulo}</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{pagina.titulo}</h1>
          </div>
          <PainelErroConteudo
            titulo="Esta página não pode ser aberta para edição."
            mensagem={erro.message}
            detalhes={erro.detalhes}
            arquivo={`content/${id}.md`}
          />
        </div>
      </>
    )
  }

  const definicao = obterDefinicao(id)
  const resumos: Record<string, ResumoCalculado[]> = Object.fromEntries(
    (definicao.colecoes ?? []).map((colecao) => [colecao.nome, calcularResumos(documento, colecao)]),
  )

  return (
    <>
      <AppHeader trilha={trilha} />
      <PaginaRelatorio
        documento={documento}
        definicao={definicao}
        resumos={resumos}
        onSalvar={salvarDocumento.bind(null, id)}
        onPedirIA={pedirIAAction.bind(null, id)}
        onGerarRelatorio={gerarRelatorioAction.bind(null, id)}
      />
    </>
  )
}
