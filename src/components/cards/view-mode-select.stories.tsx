import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import type { ModoVisualizacao } from "@/lib/content/types"

import { ViewModeSelect } from "./view-mode-select"

const meta = {
  title: "BusinessOS/Cards/ViewModeSelect",
  component: ViewModeSelect,
  args: { value: "grade", onValueChange: fn() },
  render: function Render(args) {
    const [modo, setModo] = React.useState<ModoVisualizacao>(args.value)
    return (
      <ViewModeSelect
        {...args}
        value={modo}
        onValueChange={(m) => {
          setModo(m)
          args.onValueChange(m)
        }}
      />
    )
  },
} satisfies Meta<typeof ViewModeSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Grade: Story = {}
export const Lista: Story = { args: { value: "lista" } }
