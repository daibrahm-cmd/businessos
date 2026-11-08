import * as React from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { fn } from "storybook/test"

import { docPerfilClienteIdeal } from "@/components/__fixtures__/documentos"

import { MarkdownNotes } from "./markdown-notes"

const EXEMPLO_COMPLETO = `# Entrevistas

Conversei com **4 manicures** em Curitiba. Uma frase marcante:
*"No fim do mês eu não sei se sobrou alguma coisa."*

## O que aprendi

- 3 usam o Pix pessoal para tudo
- Ninguém sabe o limite do MEI de cor
- O \`DAS\` atrasado é o gatilho mais forte

### Próximos passos

1. Testar a oferta com 5 pessoas
2. Ler o [guia do MEI](https://www.gov.br/empresas-e-negocios/pt-br/empreendedor)

<script>alert("isto aparece como texto")</script>`

const meta = {
  title: "BusinessOS/Editor/MarkdownNotes",
  component: MarkdownNotes,
  args: { valor: docPerfilClienteIdeal.corpo, onChange: fn() },
  render: function Render(args) {
    const [valor, setValor] = React.useState(args.valor)
    return (
      <MarkdownNotes
        {...args}
        valor={valor}
        onChange={(v) => {
          setValor(v)
          args.onChange(v)
        }}
      />
    )
  },
} satisfies Meta<typeof MarkdownNotes>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = { name: "Padrão" }

export const Vazio: Story = {
  args: { valor: "", placeholder: "Registre aqui conversas marcantes, frases literais e padrões que você percebeu." },
}

export const Modificado: Story = { args: { modificado: true } }

export const MarkdownCompleto: Story = {
  name: "Markdown suportado (abra Visualizar)",
  args: { valor: EXEMPLO_COMPLETO },
}
