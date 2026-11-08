import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { ThemeProvider } from "@/components/theme-provider"

import { ThemeToggle } from "./theme-toggle"

// O ThemeToggle depende do next-themes. Aqui ele ganha um ThemeProvider próprio:
// clicar no botão troca a classe do <html>, como no app (a toolbar de tema também funciona).
const meta = {
  title: "BusinessOS/Layout/ThemeToggle",
  component: ThemeToggle,
  decorators: [
    (Story) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        storageKey="businessos-storybook-tema"
        disableTransitionOnChange
      >
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = { name: "Padrão" }

export const NoCabecalho: Story = {
  name: "No cabeçalho",
  render: (args) => (
    <div className="flex h-14 items-center justify-between rounded-xl border px-4">
      <span className="text-sm font-medium">BusinessOS</span>
      <ThemeToggle {...args} />
    </div>
  ),
}
