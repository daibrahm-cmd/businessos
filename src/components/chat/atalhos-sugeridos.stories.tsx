import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AtalhosSugeridos } from "./atalhos-sugeridos"

const meta = {
  title: "BusinessOS/Chat/AtalhosSugeridos",
  component: AtalhosSugeridos,
  args: { onEscolher: () => {} },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AtalhosSugeridos>

export default meta
export const Padrao: StoryObj<typeof meta> = {}
