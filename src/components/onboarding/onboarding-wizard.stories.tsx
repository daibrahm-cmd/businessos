import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import type { ResultadoOnboarding } from "@/lib/onboarding/actions"

import { OnboardingWizard } from "./onboarding-wizard"

// A Server Action não roda no Storybook: o "concluir" é simulado.
const meta = {
  title: "BusinessOS/Onboarding/Wizard",
  component: OnboardingWizard,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  args: {
    nomeInicial: "Daiane",
    emailInicial: "dai@exemplo.com",
    aoConcluir: async (): Promise<ResultadoOnboarding> => ({ ok: true }),
  },
} satisfies Meta<typeof OnboardingWizard>

export default meta
type Story = StoryObj<typeof meta>

export const Primeira: Story = { name: "1 · Nome" }
export const SemDadosIniciais: Story = { name: "Sem dados iniciais", args: { nomeInicial: "", emailInicial: "" } }
export const FalhaAoSalvar: Story = {
  name: "Falha ao salvar",
  args: { aoConcluir: async (): Promise<ResultadoOnboarding> => ({ ok: false, mensagem: "Não foi possível salvar agora. Tente novamente em instantes." }) },
}
