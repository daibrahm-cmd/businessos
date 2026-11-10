import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { mensagensExemplo } from "./__fixtures__"
import { Digitando, MensagemAssistente, MensagemEmStream, MensagemUsuario } from "./mensagem-chat"

const meta = {
  title: "BusinessOS/Chat/Mensagem",
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Usuario: Story = { render: () => <MensagemUsuario conteudo={mensagensExemplo[0].conteudo} /> }

export const UsuarioTextoLongo: Story = {
  render: () => (
    <MensagemUsuario conteudo={"Linha um da pergunta.\nLinha dois, com bastante texto para forçar a quebra do balão em telas estreitas e ver o limite de largura em ação."} />
  ),
}

export const AssistenteComFontes: Story = { render: () => <MensagemAssistente mensagem={mensagensExemplo[1]} /> }

export const AssistenteSemFontes: Story = {
  render: () => <MensagemAssistente mensagem={{ conteudo: "Resposta curta, sem fontes.", fontes: [] }} />,
}

export const DigitandoAntesDoTexto: Story = { render: () => <MensagemEmStream texto="" /> }

export const EmStream: Story = { render: () => <MensagemEmStream texto={"Hoje o seu negócio está **em fase de direção**: o objetivo está"} /> }

export const Pontinhos: Story = { render: () => <Digitando /> }
