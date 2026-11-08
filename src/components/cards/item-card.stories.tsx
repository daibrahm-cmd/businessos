import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import {
  colecaoClientes,
  colecaoLancamentos,
  docFluxoDeCaixa,
  docPrimeirosClientes,
} from "@/components/__fixtures__/documentos"

import { CardCollection } from "./card-collection"
import { ItemCard } from "./item-card"

const meta = {
  title: "BusinessOS/Cards/ItemCard",
  component: ItemCard,
  args: {
    colecao: colecaoClientes,
    item: docPrimeirosClientes.itens[0],
    onEditar: fn(),
    onRemover: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ItemCard>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = { name: "Padrão (grade)" }

export const PoucosCampos: Story = {
  name: "Poucos campos preenchidos",
  args: { item: docPrimeirosClientes.itens[2] },
}

export const Novo: Story = { name: "Novo, não salvo", args: { pendente: "novo" } }

export const Editado: Story = { name: "Editado, não salvo", args: { pendente: "editado" } }

export const SemTitulo: Story = {
  name: "Vazio (sem título)",
  args: { item: { id: "x1", colecao: "clientes", nome: "", status: null } },
}

export const Lista: Story = {
  name: "Coleção em grade/lista",
  decorators: [(Story) => <Story />],
  render: (args) => (
    <CardCollection titulo="Clientes" chavePreferencia="storybook:itens" modoInicial="lista">
      {docPrimeirosClientes.itens.map((item, i) => (
        <ItemCard
          key={item.id}
          {...args}
          item={item}
          pendente={i === 1 ? "editado" : undefined}
        />
      ))}
    </CardCollection>
  ),
}

export const Lancamento: Story = {
  name: "Lançamento (caixa)",
  args: { colecao: colecaoLancamentos, item: docFluxoDeCaixa.itens[1] },
}
