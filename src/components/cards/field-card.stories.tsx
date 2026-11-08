import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import {
  campoData,
  campoLista,
  campoMoeda,
  campoNumero,
  campoSelecao,
  campoTextoCurto,
  campoTextoLongo,
  defPrimeirosClientes,
  docPrimeirosClientes,
} from "@/components/__fixtures__/documentos"
import type { ValorCampo } from "@/lib/content/types"

import { CardCollection } from "./card-collection"
import { FieldCard } from "./field-card"

const meta = {
  title: "BusinessOS/Cards/FieldCard",
  component: FieldCard,
  args: { campo: campoTextoCurto, valor: "25 clientes recorrentes", onChange: fn() },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  // Estado local: o card é controlado e responde à digitação na story
  render: function Render(args) {
    const [valor, setValor] = React.useState<ValorCampo>(args.valor)
    return (
      <FieldCard
        {...args}
        valor={valor}
        onChange={(v) => {
          setValor(v)
          args.onChange(v)
        }}
      />
    )
  },
} satisfies Meta<typeof FieldCard>

export default meta
type Story = StoryObj<typeof meta>

export const TextoCurto: Story = { name: "Texto curto" }

export const TextoLongo: Story = {
  name: "Texto longo",
  args: {
    campo: campoTextoLongo,
    valor: "Ter uma consultoria que me pague R$ 12 mil/mês trabalhando 30 h por semana.",
  },
}

export const Numero: Story = { name: "Número (com unidade)", args: { campo: campoNumero, valor: 25 } }

export const Moeda: Story = { args: { campo: campoMoeda, valor: 1500.5 } }

export const Lista: Story = {
  name: "Lista de textos",
  args: { campo: campoLista, valor: ["5 clientes pagantes", "Churn abaixo de 10%"] },
}

export const Selecao: Story = { name: "Seleção", args: { campo: campoSelecao, valor: "parcial" } }

export const Data: Story = { args: { campo: campoData, valor: "2027-03-31" } }

export const Vazio: Story = { args: { campo: campoTextoCurto, valor: "" } }

export const Modificado: Story = { args: { modificado: true } }

export const Erro: Story = {
  args: { campo: campoMoeda, valor: -10, erro: "Número deve ser maior ou igual a 0" },
}

export const SomenteLeitura: Story = {
  name: "Somente leitura",
  args: { campo: campoLista, valor: ["5 clientes pagantes", "Churn abaixo de 10%"], somenteLeitura: true },
}

export const SomenteLeituraVazio: Story = {
  name: "Somente leitura (vazio)",
  args: { campo: campoMoeda, valor: null, somenteLeitura: true },
}

// Todos os campos de uma página real, em grade/lista
export const PaginaInteira: Story = {
  name: "Página inteira (grade/lista)",
  decorators: [(Story) => <Story />],
  render: () => (
    <CardCollection titulo="Campos" chavePreferencia="storybook:campos">
      {defPrimeirosClientes.campos.map((campo) => (
        <FieldCard
          key={campo.nome}
          campo={campo}
          valor={docPrimeirosClientes.campos[campo.nome] ?? null}
          onChange={fn()}
        />
      ))}
    </CardCollection>
  ),
}
