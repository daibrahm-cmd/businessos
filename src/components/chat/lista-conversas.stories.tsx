import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { conversasExemplo } from "./__fixtures__"
import { ListaConversas } from "./lista-conversas"

const meta = {
  title: "BusinessOS/Chat/ListaConversas",
  component: ListaConversas,
  parameters: { layout: "fullscreen" },
  args: {
    conversas: conversasExemplo,
    ativaId: "c2",
    onRenomear: async (): Promise<string | null> => null,
    onExcluir: async (): Promise<string | null> => null,
  },
  // Largura e fundo da segunda sidebar
  decorators: [
    (Story) => (
      <div className="flex h-[640px] w-[280px] flex-col border-r border-sidebar-border bg-sidebar">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ListaConversas>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}

export const Vazia: Story = { args: { conversas: [], ativaId: null } }

export const ComErro: Story = {
  args: { conversas: [], ativaId: null, erro: "Não foi possível carregar as conversas agora." },
}

export const FalhaAoExcluir: Story = {
  name: "Falha ao excluir (abra o menu e exclua)",
  args: { onExcluir: async () => "Não foi possível excluir agora. Tente de novo." },
}

export const Mobile: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
}
