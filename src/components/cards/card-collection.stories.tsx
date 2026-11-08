import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@/components/ui/button"
import { paginasDaSecao, secoesExemplo } from "@/components/__fixtures__/documentos"

import { CardCollection } from "./card-collection"
import { PageCard } from "./page-card"

const direcao = secoesExemplo[1]
const paginas = paginasDaSecao(direcao)

const meta = {
  title: "BusinessOS/Cards/CardCollection",
  component: CardCollection,
  args: {
    chavePreferencia: "storybook:colecao",
    titulo: "Direção",
    descricao: direcao.descricao,
  },
  render: (args) => (
    <CardCollection {...args}>
      {paginas.map((p) => (
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
  ),
} satisfies Meta<typeof CardCollection>

export default meta
type Story = StoryObj<typeof meta>

export const Grade: Story = {
  args: { chavePreferencia: "storybook:colecao-grade", modoInicial: "grade" },
}

export const Lista: Story = {
  args: { chavePreferencia: "storybook:colecao-lista", modoInicial: "lista" },
}

export const ComAcoes: Story = {
  name: "Com ações",
  args: {
    chavePreferencia: "storybook:colecao-acoes",
    acoes: (
      <Button variant="outline" className="h-11 md:h-8">
        Exportar
      </Button>
    ),
  },
}

export const Vazio: Story = {
  args: {
    chavePreferencia: "storybook:colecao-vazia",
    titulo: "Clientes (0)",
    descricao: undefined,
    vazio: (
      <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum item em clientes ainda.
      </div>
    ),
  },
  render: (args) => <CardCollection {...args} />,
}

