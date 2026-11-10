import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { statusPorIdExemplo } from "@/components/__fixtures__/documentos"

import { AppHeader } from "./app-header"
import { AppSidebar } from "./app-sidebar"

const meta = {
  title: "BusinessOS/Layout/AppSidebar",
  component: AppSidebar,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true, navigation: { pathname: "/validacao/primeiros-clientes" } },
  },
  decorators: [
    (Story) => (
      <SidebarProvider>
        <Story />
        <SidebarInset>
          <AppHeader
            trilha={[
              { rotulo: "Início", href: "/" },
              { rotulo: "Validação", href: "/validacao" },
              { rotulo: "Primeiros Clientes" },
            ]}
          />
          <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
            <p className="text-sm text-muted-foreground">Conteúdo da página.</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    ),
  ],
  args: { statusPorId: statusPorIdExemplo },
} satisfies Meta<typeof AppSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = { name: "Padrão (com status)" }

export const SemStatus: Story = {
  name: "Sem status (vazio)",
  args: { statusPorId: undefined },
}

export const InicioAtivo: Story = {
  name: "Início ativo",
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/" } } },
}

export const Mobile: Story = {
  name: "Mobile (sheet)",
  globals: { viewport: { value: "mobile1", isRotated: false } },
}

export const PrincipalAtivo: Story = {
  name: "Principal ativo (conversa aberta)",
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/principal/c1" } } },
}
