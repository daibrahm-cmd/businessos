import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { SidebarProvider } from "@/components/ui/sidebar"

import { AppHeader } from "./app-header"

const meta = {
  title: "BusinessOS/Layout/AppHeader",
  component: AppHeader,
  parameters: { layout: "fullscreen" },
  // SidebarTrigger precisa do contexto da sidebar
  decorators: [
    (Story) => (
      <SidebarProvider defaultOpen={false} className="min-h-0">
        <div className="w-full">
          <Story />
        </div>
      </SidebarProvider>
    ),
  ],
  args: {
    trilha: [
      { rotulo: "Início", href: "/" },
      { rotulo: "Validação", href: "/validacao" },
      { rotulo: "Primeiros Clientes" },
    ],
  },
} satisfies Meta<typeof AppHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Pagina: Story = { name: "Página (3 níveis)" }

export const Secao: Story = {
  name: "Seção",
  args: { trilha: [{ rotulo: "Início", href: "/" }, { rotulo: "Direção" }] },
}

export const Inicio: Story = {
  name: "Início",
  args: { trilha: [{ rotulo: "Início" }] },
}

export const Mobile: Story = {
  name: "Mobile (só o último item)",
  globals: { viewport: { value: "mobile1", isRotated: false } },
}
