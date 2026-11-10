import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import { defPerfilClienteIdeal, docPerfilClienteIdeal } from "@/components/__fixtures__/documentos"
import type { PageEditorProps } from "@/components/editor/page-editor"
import { Button } from "@/components/ui/button"

import { GavetaItem } from "./gaveta-item"

type Salvar = PageEditorProps["onSalvar"]

// Gaveta lateral de um item de coleção: leitura de todos os campos e edição na hora.
const meta = {
  title: "BusinessOS/Relatório/GavetaItem",
  component: GavetaItem,
  args: {
    colecao: defPerfilClienteIdeal.colecoes![0],
    item: docPerfilClienteIdeal.itens[0],
    atualizadoEm: docPerfilClienteIdeal.atualizado_em,
    onFechar: fn(),
    onSalvar: fn<Salvar>(async () => ({ ok: true, documento: docPerfilClienteIdeal })),
  },
  // Estado local: a gaveta fecha de verdade e pode ser reaberta pelo botão
  render: function Render(args) {
    const [aberto, setAberto] = React.useState(true)
    return (
      <>
        <Button variant="outline" onClick={() => setAberto(true)}>
          Abrir persona
        </Button>
        <GavetaItem {...args} item={aberto ? args.item : undefined} onFechar={() => setAberto(false)} />
      </>
    )
  },
} satisfies Meta<typeof GavetaItem>

export default meta
type Story = StoryObj<typeof meta>

export const Aberta: Story = { name: "Aberta (leitura)" }

export const CamposVazios: Story = {
  name: "Persona com campos vazios",
  args: { item: docPerfilClienteIdeal.itens[2] },
}
