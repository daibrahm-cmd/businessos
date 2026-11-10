import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import type { FieldDef } from "@/lib/content/schemas/field-types"

import { CelulaItem } from "./celula-item"

// Valor curto de um campo de item: selo (seleção), barra (número com máximo), link, data e texto.
const selecaoEstagio: FieldDef = {
  nome: "estagio",
  rotulo: "Estágio",
  tipo: "selecao",
  opcoes: [
    { valor: "novo", rotulo: "Novo" },
    { valor: "contatado", rotulo: "Contatado" },
    { valor: "qualificado", rotulo: "Qualificado" },
    { valor: "em-negociacao", rotulo: "Em negociação" },
    { valor: "ganho", rotulo: "Ganho" },
    { valor: "perdido", rotulo: "Perdido" },
  ],
}

const meta = {
  title: "BusinessOS/Relatório/CelulaItem",
  component: CelulaItem,
  args: { campo: selecaoEstagio, valor: "qualificado" },
} satisfies Meta<typeof CelulaItem>

export default meta
type Story = StoryObj<typeof meta>

export const Selo: Story = { name: "Selo de seleção" }

/** Todos os estágios lado a lado, para comparar o contraste nos dois temas. */
export const TodosOsSelos: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {selecaoEstagio.tipo === "selecao" &&
        selecaoEstagio.opcoes.map((o) => <CelulaItem key={o.valor} campo={selecaoEstagio} valor={o.valor} />)}
    </div>
  ),
}

export const BarraDePontos: Story = {
  name: "Barra de pontos (número com máximo)",
  args: { campo: { nome: "fit", rotulo: "Fit", tipo: "numero", inteiro: true, min: 0, max: 100, unidade: "pts" }, valor: 72 },
}

export const Link: Story = {
  args: { campo: { nome: "link", rotulo: "Link", tipo: "texto-curto" }, valor: "https://exemplo.com.br/caso" },
}

export const Data: Story = {
  args: { campo: { nome: "entrou", rotulo: "Entrou em", tipo: "data" }, valor: "2026-11-09" },
}

export const Texto: Story = {
  args: { campo: { nome: "empresa", rotulo: "Empresa", tipo: "texto-curto" }, valor: "Metalúrgica Silva" },
}

export const Vazio: Story = { args: { valor: null } }
