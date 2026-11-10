import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { PromptArea } from "./prompt-area"

const meta = {
  title: "BusinessOS/Chat/PromptArea",
  component: PromptArea,
  parameters: { layout: "padded" },
  args: { valor: "", onValorChange: () => {}, onEnviar: () => {}, onParar: () => {} },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PromptArea>

export default meta
type Story = StoryObj<typeof meta>

/** Controlado de verdade: digite, use Shift+Enter para quebrar linha e veja o campo crescer. */
export const Interativo: Story = {
  render: function Render(args) {
    const [valor, setValor] = React.useState("")
    return <PromptArea {...args} valor={valor} onValorChange={setValor} onEnviar={() => setValor("")} />
  },
}

export const Vazio: Story = {}

export const ComTextoLongo: Story = {
  args: {
    valor:
      "Quero entender como a minha oferta se compara com o que os concorrentes do mapa de mercado entregam hoje.\nConsidere também o estilo de vida que eu descrevi.\nE aponte o que falta validar.",
  },
}

export const Transmitindo: Story = { args: { transmitindo: true } }
