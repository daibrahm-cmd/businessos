import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { paginasDaSecao, secoesExemplo } from "@/components/__fixtures__/documentos"

import { CardCollection } from "./card-collection"
import { SectionCard } from "./section-card"

const [founder, direcao, validacao] = secoesExemplo

const meta = {
  title: "BusinessOS/Cards/SectionCard",
  component: SectionCard,
  args: { secao: direcao, paginas: paginasDaSecao(direcao) },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = { name: "Padrão" }

export const Concluida: Story = {
  name: "Tudo validado",
  args: { secao: founder, paginas: paginasDaSecao(founder, { "founder/objetivo": "validado", "founder/estilo-de-vida": "validado" }) },
}

export const Vazia: Story = {
  name: "Vazia (nada iniciado)",
  args: { secao: validacao, paginas: paginasDaSecao(validacao, {}) },
}

// Como na home: as 4 seções numa CardCollection
export const Home: Story = {
  name: "Home (4 seções)",
  decorators: [(Story) => <Story />],
  render: () => (
    <CardCollection
      titulo="Visão geral"
      descricao="Acompanhe o que já está claro no seu negócio e o que falta decidir."
      chavePreferencia="storybook:inicio"
    >
      {secoesExemplo.map((secao) => (
        <SectionCard key={secao.slug} secao={secao} paginas={paginasDaSecao(secao)} />
      ))}
    </CardCollection>
  ),
}
