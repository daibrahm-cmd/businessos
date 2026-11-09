"use server"
// Server Action do modal de edição de agente: valida a entrada (vem do cliente) e nunca lança para a UI.
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { docIdSchema } from "@/lib/content/schemas/base"
import { RE_NOME_AGENTE } from "@/lib/content/agentes"
import { ErroAgente, salvarAgente } from "@/lib/workflow/agentes"

export type ResultadoAgente = { ok: true } | { ok: false; mensagem: string }

const edicaoSchema = z.strictObject({
  apelido: z.string().trim().max(40).optional(),
  papel: z.string().trim().min(1).max(120),
  descricao: z.string().trim().min(1).max(300),
  le: z.array(docIdSchema).min(1),
  escreve: z.array(docIdSchema),
  instrucoes: z.string().max(20_000),
})

export async function salvarAgenteAction(nome: unknown, entrada: unknown): Promise<ResultadoAgente> {
  if (typeof nome !== "string" || !RE_NOME_AGENTE.test(nome)) return { ok: false, mensagem: "Agente inválido." }
  const r = edicaoSchema.safeParse(entrada)
  if (!r.success) {
    return { ok: false, mensagem: "Dados inválidos. Confira papel, descrição e ao menos uma página em “Lê”." }
  }
  try {
    await salvarAgente(nome, { ...r.data, apelido: r.data.apelido || undefined })
    revalidatePath("/agentes")
    revalidatePath("/workflow")
    return { ok: true }
  } catch (erro) {
    if (erro instanceof ErroAgente) return { ok: false, mensagem: erro.message }
    console.error("[agentes]", erro)
    return { ok: false, mensagem: "Não foi possível salvar o agente. Tente de novo." }
  }
}
