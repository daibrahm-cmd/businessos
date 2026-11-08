import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import { Button } from "@/components/ui/button"
import { colecaoClientes, colecaoLancamentos, docPrimeirosClientes } from "@/components/__fixtures__/documentos"

import { ItemForm } from "./item-form"

const meta = {
  title: "BusinessOS/Cards/ItemForm",
  component: ItemForm,
  args: {
    colecao: colecaoClientes,
    aberto: true,
    onAbertoChange: fn(),
    onConfirmar: fn(),
  },
  // Estado local de "aberto" + botão para reabrir depois de fechar
  render: function Render(args) {
    const [aberto, setAberto] = React.useState(args.aberto)
    return (
      <>
        <Button variant="outline" onClick={() => setAberto(true)}>
          Abrir formulário
        </Button>
        <ItemForm
          {...args}
          aberto={aberto}
          onAbertoChange={(a) => {
            setAberto(a)
            args.onAbertoChange(a)
          }}
        />
      </>
    )
  },
} satisfies Meta<typeof ItemForm>

export default meta
type Story = StoryObj<typeof meta>

export const Novo: Story = { name: "Novo item" }

export const Edicao: Story = {
  name: "Edição",
  args: { itemInicial: docPrimeirosClientes.itens[0] },
}

export const ErrosDoServidor: Story = {
  name: "Erros (do servidor)",
  args: {
    itemInicial: docPrimeirosClientes.itens[1],
    errosServidor: { valor: "Número deve ser maior ou igual a 0", nome: "Campo obrigatório." },
  },
}

export const LancamentoNovo: Story = {
  name: "Lançamento novo (obrigatórios)",
  args: { colecao: colecaoLancamentos },
}
