import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { StatusBadge } from "./status-badge"

const meta = {
  title: "BusinessOS/Cards/StatusBadge",
  component: StatusBadge,
  args: { status: "rascunho" },
} satisfies Meta<typeof StatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Vazio: Story = { args: { status: "vazio" } }
export const Rascunho: Story = { args: { status: "rascunho" } }
export const EmValidacao: Story = { name: "Em validação", args: { status: "em-validacao" } }
export const Validado: Story = { args: { status: "validado" } }

export const Todos: Story = {
  name: "Todos lado a lado",
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="vazio" />
      <StatusBadge status="rascunho" />
      <StatusBadge status="em-validacao" />
      <StatusBadge status="validado" />
    </div>
  ),
}
