import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { mensagensExemplo } from "./__fixtures__"
import { ListaMensagens } from "./lista-mensagens"

const meta = {
  title: "BusinessOS/Chat/ListaMensagens",
  component: ListaMensagens,
  parameters: { layout: "fullscreen" },
  args: { mensagens: mensagensExemplo, textoParcial: "", status: "ocioso", erro: null },
  decorators: [
    (Story) => (
      <div className="flex h-[560px] flex-col">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ListaMensagens>

export default meta
type Story = StoryObj<typeof meta>

export const Conversa: Story = {}

export const Aguardando: Story = { args: { mensagens: mensagensExemplo.slice(0, 1), status: "aguardando" } }

export const Transmitindo: Story = {
  args: {
    mensagens: mensagensExemplo.slice(0, 1),
    status: "transmitindo",
    textoParcial: "Hoje o seu negócio está **em fase de direção**:\n\n- **Objetivo:** primeira receita recorrente",
  },
}

export const ComErro: Story = {
  args: {
    mensagens: mensagensExemplo.slice(0, 1),
    erro: "Não consegui falar com a IA agora. Tente de novo em instantes.",
    onTentarDeNovo: () => {},
  },
}
