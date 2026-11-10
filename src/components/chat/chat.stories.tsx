import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { SidebarProvider } from "@/components/ui/sidebar"

import { conversaExemplo, conversasExemplo } from "./__fixtures__"
import { Chat } from "./chat"
import { ConversasProvider } from "./conversas-provider"

// Nas stories o envio responde 500 (sem /api/chat): mostra o erro amigável sem mexer na URL do Storybook.
const meta = {
  title: "BusinessOS/Chat/Chat",
  component: Chat,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true, navigation: { pathname: "/principal" } } },
  decorators: [
    (Story) => (
      <SidebarProvider defaultOpen={false} className="min-h-0">
        <ConversasProvider conversasIniciais={conversasExemplo}>
          <div className="flex h-[640px] w-full flex-col bg-background">
            <Story />
          </div>
        </ConversasProvider>
      </SidebarProvider>
    ),
  ],
} satisfies Meta<typeof Chat>

export default meta
type Story = StoryObj<typeof meta>

export const Principal: Story = {}

export const ConversaSalva: Story = { args: { conversaInicial: conversaExemplo } }
