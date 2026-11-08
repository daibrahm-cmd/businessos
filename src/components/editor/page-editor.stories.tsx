import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fireEvent, fn, userEvent, within } from "storybook/test"

import {
  defFluxoDeCaixa,
  defPerfilClienteIdeal,
  defPrimeirosClientes,
  docFluxoDeCaixa,
  docPerfilClienteIdeal,
  docPrimeirosClientes,
  docPrimeirosClientesAlteradoPorAgente,
  docPrimeirosClientesVazio,
  resumosFluxoDeCaixa,
  resumosPrimeirosClientes,
} from "@/components/__fixtures__/documentos"
import type { ContentDoc, DocPatch, Item } from "@/lib/content/types"

import { PageEditor, type PageEditorProps } from "./page-editor"

type Salvar = PageEditorProps["onSalvar"]

// Simula o servidor: aplica o patch (merge simplificado) depois de um pequeno atraso
function simularSalvamento(atrasoMs = 700): Salvar {
  return async (patch) => {
    await new Promise((resolver) => setTimeout(resolver, atrasoMs))
    return { ok: true, documento: aplicarPatchSimulado(docPrimeirosClientes, patch) }
  }
}

function aplicarPatchSimulado(doc: ContentDoc, patch: DocPatch): ContentDoc {
  const remover = new Set(patch.itens_remover ?? [])
  let itens = doc.itens.filter((item) => !remover.has(item.id))
  for (const parcial of patch.itens ?? []) {
    const item = parcial as Item
    itens = itens.some((i) => i.id === item.id)
      ? itens.map((i) => (i.id === item.id ? { ...i, ...item } : i))
      : [...itens, item]
  }
  return {
    ...doc,
    campos: { ...doc.campos, ...patch.campos },
    itens,
    corpo: patch.corpo ?? doc.corpo,
    status: patch.status ?? (doc.status === "vazio" ? "rascunho" : doc.status),
    atualizado_em: new Date().toISOString(),
    atualizado_por: "humano",
  }
}

/** Edita o roteiro de abordagem (gera 1 alteração pendente). */
async function editarRoteiro(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  const campo = await canvas.findByLabelText<HTMLTextAreaElement>("Roteiro de abordagem")
  // fireEvent.change usa o setter nativo (o React percebe a mudança no campo controlado)
  fireEvent.change(campo, {
    target: { value: `${campo.value} Depois, mando o link do diagnóstico gratuito.` },
  })
  return canvas
}

const meta = {
  title: "BusinessOS/Editor/PageEditor",
  component: PageEditor,
  parameters: { layout: "fullscreen" },
  args: {
    documento: docPrimeirosClientes,
    definicao: defPrimeirosClientes,
    resumos: resumosPrimeirosClientes,
    onSalvar: fn<Salvar>(simularSalvamento()),
  },
} satisfies Meta<typeof PageEditor>

export default meta
type Story = StoryObj<typeof meta>

/** Documento salvo, sem alterações (a SaveBar fica oculta). */
export const Limpo: Story = {}

/** Página nunca editada: campos e coleção vazios. */
export const Vazio: Story = {
  args: { documento: docPrimeirosClientesVazio, resumos: { clientes: [] } },
}

/** Página só com campos (sem coleções). */
export const SoCampos: Story = {
  name: "Só campos",
  args: { documento: docPerfilClienteIdeal, definicao: defPerfilClienteIdeal, resumos: {} },
}

/** Caixa: coleção ordenada por data e resumo de saldo negativo. */
export const Caixa: Story = {
  args: { documento: docFluxoDeCaixa, definicao: defFluxoDeCaixa, resumos: resumosFluxoDeCaixa },
}

/** Uma edição feita: SaveBar visível com a contagem e o ponto "alterado". */
export const ComAlteracoes: Story = {
  name: "Com alterações",
  play: async ({ canvasElement }) => {
    const canvas = await editarRoteiro(canvasElement)
    await expect(await canvas.findByText("1 alteração não salva")).toBeInTheDocument()
  },
}

/** Salvamento em andamento (a promessa demora a resolver). */
export const Salvando: Story = {
  args: { onSalvar: fn<Salvar>(simularSalvamento(60_000)) },
  play: async ({ canvasElement }) => {
    const canvas = await editarRoteiro(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Salvar" }))
  },
}

/** Um agente salvou a página no meio da edição: diálogo de conflito (RF-16). */
export const Conflito: Story = {
  args: {
    onSalvar: fn<Salvar>(async (_patch, esperado) => {
      await new Promise((resolver) => setTimeout(resolver, 400))
      // "Salvar mesmo assim" reenvia sem precondição: aí o servidor aceita
      if (esperado === undefined) {
        return { ok: true, documento: { ...docPrimeirosClientesAlteradoPorAgente, atualizado_em: new Date().toISOString(), atualizado_por: "humano" } }
      }
      return {
        ok: false,
        erro: { codigo: "CONFLITO", mensagem: "O documento foi alterado por agente:estrategista." },
        documentoAtual: docPrimeirosClientesAlteradoPorAgente,
      }
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = await editarRoteiro(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Salvar" }))
  },
}

/** Servidor recusou um valor: erro aparece no card do campo. */
export const ErroDeValidacao: Story = {
  name: "Erro de validação",
  args: {
    onSalvar: fn<Salvar>(async () => ({
      ok: false,
      erro: {
        codigo: "PAYLOAD_INVALIDO",
        mensagem: "Dados inválidos para a página validacao/primeiros-clientes.",
        campos: { "campos.roteiro_de_abordagem": "Texto muito longo (máximo de 5000 caracteres)." },
      },
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = await editarRoteiro(canvasElement)
    await userEvent.click(await canvas.findByRole("button", { name: "Salvar" }))
  },
}
