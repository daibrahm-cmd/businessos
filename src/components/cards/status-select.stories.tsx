import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import type { Status } from "@/lib/content/types"

import { StatusSelect } from "./status-select"

const meta = {
  title: "BusinessOS/Cards/StatusSelect",
  component: StatusSelect,
  args: { value: "rascunho", onValueChange: fn() },
  // Estado local para a story responder à escolha (o componente é controlado)
  render: function Render(args) {
    const [valor, setValor] = React.useState<Status>(args.value)
    return (
      <StatusSelect
        {...args}
        value={valor}
        onValueChange={(s) => {
          setValor(s)
          args.onValueChange(s)
        }}
      />
    )
  },
} satisfies Meta<typeof StatusSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = { name: "Padrão" }
export const Vazio: Story = { args: { value: "vazio" } }
export const Validado: Story = { args: { value: "validado" } }
export const Desabilitado: Story = { args: { disabled: true } }
