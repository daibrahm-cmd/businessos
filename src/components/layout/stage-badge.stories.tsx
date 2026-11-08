import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { StageBadge } from "./stage-badge"

const meta = {
  title: "BusinessOS/Layout/StageBadge",
  component: StageBadge,
} satisfies Meta<typeof StageBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = { name: "Padrão" }

export const EstagioExplicito: Story = {
  name: "Estágio explícito",
  args: { estagio: "para-quem-esta-comecando" },
}
