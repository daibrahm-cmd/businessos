// Oportunidades: funil Kanban dos leads (do primeiro contato ao ganho ou perdido).
import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"
import { CabecalhoPagina } from "@/components/relatorio/cabecalho-pagina"
import { ErroOportunidades, lerOportunidades } from "@/lib/oportunidades/repositorio"
import type { Oportunidade } from "@/lib/oportunidades/tipos"

import { PainelErroConteudo } from "../_componentes/painel-erro-conteudo"
import { QuadroOportunidades } from "./quadro-oportunidades"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Oportunidades" }

/** Arquivo inválido vira painel de erro em vez de quebrar a página. */
async function carregar(): Promise<{ oportunidades: Oportunidade[] } | { erro: string }> {
  try {
    return { oportunidades: await lerOportunidades() }
  } catch (erro) {
    if (erro instanceof ErroOportunidades) return { erro: erro.message }
    throw erro
  }
}

export default async function OportunidadesPage() {
  const resultado = await carregar()
  const total = "oportunidades" in resultado ? resultado.oportunidades.length : 0

  return (
    <>
      <AppHeader trilha={[{ rotulo: "Oportunidades" }]} />
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-10">
        <CabecalhoPagina
          eyebrow="Vendas"
          titulo="Oportunidades"
          descricao={total === 0 ? "Nenhuma oportunidade cadastrada." : `${total} oportunidade(s) no funil.`}
        />
        {"erro" in resultado ? (
          <PainelErroConteudo titulo="O arquivo de oportunidades está inválido." mensagem={resultado.erro} />
        ) : (
          <QuadroOportunidades oportunidades={resultado.oportunidades} />
        )}
      </div>
    </>
  )
}
