import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { DATA_EPOCA_FIXTURE, paginasDaSecao, secoesExemplo } from "@/components/__fixtures__/documentos"

import { CardCollection } from "./card-collection"
import { PageCard } from "./page-card"

const meta = {
  title: "BusinessOS/Cards/PageCard",
  component: PageCard,
  args: {
    href: "/validacao/primeiros-clientes",
    titulo: "Primeiros Clientes",
    descricao: "Os primeiros clientes e conversas de venda como evidência de validação.",
    status: "em-validacao",
    completude: 67,
    atualizadoEm: "2026-11-08T18:05:44.120Z",
    icone: "users",
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageCard>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = { name: "Padrão" }

export const Vazio: Story = {
  name: "Vazio (nunca editado)",
  args: { status: "vazio", completude: 0, atualizadoEm: DATA_EPOCA_FIXTURE },
}

export const Validado: Story = { args: { status: "validado", completude: 100 } }

export const SemIcone: Story = { name: "Sem ícone", args: { icone: undefined } }

// Índice de seção: um PageCard por página, em grade ou lista
export const IndiceDaSecao: Story = {
  name: "Índice da seção (grade/lista)",
  decorators: [(Story) => <Story />],
  render: () => {
    const validacao = secoesExemplo[2]
    return (
      <CardCollection titulo={validacao.nome} descricao={validacao.descricao} chavePreferencia="secao:validacao">
        {paginasDaSecao(validacao).map((p) => (
          <PageCard
            key={p.href}
            href={p.href}
            titulo={p.pagina.titulo}
            descricao={p.pagina.descricao}
            status={p.status}
            completude={p.completude}
            atualizadoEm={p.atualizadoEm}
            icone={p.pagina.icone}
          />
        ))}
      </CardCollection>
    )
  },
}
