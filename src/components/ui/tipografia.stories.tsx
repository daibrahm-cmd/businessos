import type { Meta, StoryObj } from "@storybook/nextjs-vite"

// Fontes do app: IBM Plex Mono em tudo (--font-sans, --font-mono, --font-heading) e
// Cormorant Garamond só nos títulos de página (classe font-display). Mesmas do root layout.
const meta = {
  title: "Fundamentos/Tipografia",
  parameters: { layout: "padded" },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const PESOS = [
  { peso: "font-light", rotulo: "300 Light" },
  { peso: "font-normal", rotulo: "400 Regular" },
  { peso: "font-medium", rotulo: "500 Medium" },
  { peso: "font-semibold", rotulo: "600 SemiBold" },
  { peso: "font-bold", rotulo: "700 Bold" },
] as const

export const IBMPlexMono: Story = {
  name: "IBM Plex Mono (corpo e interface)",
  render: () => (
    <div className="space-y-6">
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">--font-sans · --font-mono · --font-heading</p>
      {PESOS.map((p) => (
        <p key={p.peso} className={`${p.peso} text-2xl`}>
          {p.rotulo} · A marca consistente em todos os canais
        </p>
      ))}
      <div className="space-y-1">
        <p className="text-4xl leading-none font-bold text-primary tabular-nums">01</p>
        <p className="text-lg font-bold">Título de card · 18 px bold</p>
        <p className="text-sm font-medium text-primary">Frase de destaque · 14 px medium</p>
        <p className="text-xs text-muted-foreground">Texto de apoio · 12 px</p>
      </div>
    </div>
  ),
}

export const CormorantGaramond: Story = {
  name: "Cormorant Garamond (títulos de página)",
  render: () => (
    <div className="space-y-4">
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">--font-display · classe font-display</p>
      <h1 className="font-display text-5xl font-semibold">Perfil de Cliente Ideal</h1>
      <h2 className="font-display text-3xl font-medium">Quem mais sente o problema escolhido</h2>
    </div>
  ),
}
