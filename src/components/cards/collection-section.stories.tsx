import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import {
  colecaoClientes,
  colecaoLancamentos,
  docFluxoDeCaixa,
  docPrimeirosClientes,
  resumosFluxoDeCaixa,
  resumosPrimeirosClientes,
} from "@/components/__fixtures__/documentos"
import type { Item } from "@/lib/content/types"

import { CollectionSection } from "./collection-section"

const meta = {
  title: "BusinessOS/Cards/CollectionSection",
  component: CollectionSection,
  args: {
    colecao: colecaoClientes,
    itens: docPrimeirosClientes.itens,
    pendentes: {},
    resumos: resumosPrimeirosClientes.clientes,
    onSalvarItem: fn(),
    onRemoverItem: fn(),
    chavePreferencia: "storybook:clientes",
  },
  // Estado local: adicionar/editar/remover funcionam na story (o componente não guarda itens)
  render: function Render(args) {
    const [itens, setItens] = React.useState<Item[]>(args.itens)
    const [pendentes, setPendentes] = React.useState(args.pendentes)
    return (
      <CollectionSection
        {...args}
        itens={itens}
        pendentes={pendentes}
        onSalvarItem={(item) => {
          const existe = itens.some((i) => i.id === item.id)
          setItens(existe ? itens.map((i) => (i.id === item.id ? item : i)) : [...itens, item])
          setPendentes({ ...pendentes, [item.id]: existe ? "editado" : "novo" })
          args.onSalvarItem(item)
        }}
        onRemoverItem={(id) => {
          setItens(itens.filter((i) => i.id !== id))
          args.onRemoverItem(id)
        }}
      />
    )
  },
} satisfies Meta<typeof CollectionSection>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = { name: "Padrão (com resumos)" }

export const ComPendentes: Story = {
  name: "Com itens não salvos",
  args: { pendentes: { f6e7d8c9b0: "editado" } },
}

export const Vazio: Story = { args: { itens: [], resumos: [] } }

export const SaldoNegativo: Story = {
  name: "Lançamentos (ordenados por data, saldo negativo)",
  args: {
    colecao: colecaoLancamentos,
    itens: docFluxoDeCaixa.itens,
    resumos: resumosFluxoDeCaixa.lancamentos,
    chavePreferencia: "storybook:lancamentos",
  },
}
