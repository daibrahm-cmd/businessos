import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import { defPerfilClienteIdeal, docPerfilClienteIdeal } from "@/components/__fixtures__/documentos"

import { CartaoPersona } from "./relatorio-pagina"

// Card da coleção "personas": número grande, nome, frase em destaque, perfil, momento e gatilhos em chips.
const meta = {
  title: "BusinessOS/Relatório/CartaoPersona",
  component: CartaoPersona,
  args: {
    colecao: defPerfilClienteIdeal.colecoes![0],
    item: docPerfilClienteIdeal.itens[0],
    indice: 0,
    onAbrir: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CartaoPersona>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = { name: "Padrão (5 gatilhos, 3 chips + resto)" }

export const PoucosGatilhos: Story = {
  name: "Poucos gatilhos (sem +N)",
  args: { item: docPerfilClienteIdeal.itens[1], indice: 1 },
}

export const SoComCabecalho: Story = {
  name: "Só cabeçalho (sem momento nem gatilhos)",
  args: { item: docPerfilClienteIdeal.itens[2], indice: 2 },
}

export const SomenteLeitura: Story = {
  name: "Somente leitura (sem gaveta)",
  args: { onAbrir: undefined },
}
