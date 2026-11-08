import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import { SaveBar } from "./save-bar"

const meta = {
  title: "BusinessOS/Editor/SaveBar",
  component: SaveBar,
  args: { visivel: true, salvando: false, quantidade: 4, onSalvar: fn(), onDescartar: fn() },
  parameters: { layout: "fullscreen" },
  // A barra é sticky no rodapé: a story dá uma área com rolagem para ela se apoiar
  decorators: [
    (Story) => (
      <div className="flex min-h-80 flex-col justify-end p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SaveBar>

export default meta
type Story = StoryObj<typeof meta>

export const Visivel: Story = { name: "Visível" }
export const UmaAlteracao: Story = { name: "Uma alteração", args: { quantidade: 1 } }
export const Salvando: Story = { args: { salvando: true } }
export const MensagemPropria: Story = { name: "Mensagem própria", args: { mensagem: "Há um conflito para resolver" } }
export const Oculta: Story = { args: { visivel: false, quantidade: 0 } }
