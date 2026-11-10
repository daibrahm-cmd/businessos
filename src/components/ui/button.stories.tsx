import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { PlusIcon } from "lucide-react"

import { Button } from "./button"

// Story de prova do setup: valida Tailwind, tokens do shadcn, fonte IBM Plex Mono e tema claro/escuro.
const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Salvar",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  name: "Padrão",
}

export const Secundario: Story = {
  name: "Secundário",
  args: { variant: "secondary" },
}

export const Contorno: Story = {
  args: { variant: "outline" },
}

export const Fantasma: Story = {
  args: { variant: "ghost" },
}

export const Destrutivo: Story = {
  args: { variant: "destructive", children: "Excluir" },
}

export const Link: Story = {
  args: { variant: "link", children: "Ver detalhes" },
}

export const ComIcone: Story = {
  name: "Com ícone",
  args: {
    children: (
      <>
        <PlusIcon data-icon="inline-start" />
        Novo item
      </>
    ),
  },
}

// Todas as variantes lado a lado, para comparar nos dois temas
export const TodasAsVariantes: Story = {
  name: "Todas as variantes",
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="default">Padrão</Button>
      <Button {...args} variant="secondary">Secundário</Button>
      <Button {...args} variant="outline">Contorno</Button>
      <Button {...args} variant="ghost">Fantasma</Button>
      <Button {...args} variant="destructive">Destrutivo</Button>
      <Button {...args} variant="link">Link</Button>
      <Button {...args} variant="outline" size="icon" aria-label="Adicionar">
        <PlusIcon />
      </Button>
    </div>
  ),
}
