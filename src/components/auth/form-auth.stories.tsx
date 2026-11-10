import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { FormCadastrar, FormEntrar } from "./form-auth"

// As Server Actions não rodam no Storybook: aqui vale só o visual (o envio não faz nada).
const meta = {
  title: "BusinessOS/Auth/Formulários",
  parameters: { layout: "centered", nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <div className="w-[22rem]">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">BusinessOS</CardTitle>
            <CardDescription>Acesse o contexto do seu negócio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Story />
          </CardContent>
        </Card>
      </div>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Login: Story = { render: () => <FormEntrar /> }
export const LoginLinkExpirado: Story = {
  name: "Login com aviso",
  render: () => <FormEntrar avisoInicial="Link inválido ou expirado. Entre ou peça um novo." />,
}
export const Cadastro: Story = { render: () => <FormCadastrar /> }
