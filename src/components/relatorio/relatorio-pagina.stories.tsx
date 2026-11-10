import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import {
  defPerfilClienteIdeal,
  defPrimeirosClientes,
  docPerfilClienteIdeal,
  docPrimeirosClientes,
  resumosPrimeirosClientes,
} from "@/components/__fixtures__/documentos"
import type { PageEditorProps } from "@/components/editor/page-editor"

import { RelatorioPagina } from "./relatorio-pagina"

type Salvar = PageEditorProps["onSalvar"]

// Relatório de leitura de uma página: título, indicadores, blocos por grupo e coleções em cards.
const meta = {
  title: "BusinessOS/Relatório/RelatorioPagina",
  component: RelatorioPagina,
  parameters: { layout: "fullscreen" },
  args: {
    documento: docPerfilClienteIdeal,
    definicao: defPerfilClienteIdeal,
    resumos: {},
    onSalvar: fn<Salvar>(async () => ({ ok: true, documento: docPerfilClienteIdeal })),
  },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-5xl p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RelatorioPagina>

export default meta
type Story = StoryObj<typeof meta>

/** Perfil de Cliente Ideal: campos da página e a coleção de personas (cards com número, frase e gatilhos). */
export const PerfilComPersonas: Story = { name: "Perfil de Cliente Ideal (com personas)" }

export const SemPersonas: Story = {
  name: "Sem personas ainda",
  args: { documento: { ...docPerfilClienteIdeal, itens: [] } },
}

/** Coleção com cards de lista comuns (sem a variante persona). */
export const ColecaoPadrao: Story = {
  name: "Primeiros Clientes (cards padrão)",
  args: {
    documento: docPrimeirosClientes,
    definicao: defPrimeirosClientes,
    resumos: resumosPrimeirosClientes,
  },
}

export const SomenteLeitura: Story = { name: "Somente leitura", args: { onSalvar: undefined } }
