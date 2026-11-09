"use server"
// Server Actions das oportunidades: validam a entrada (vem do cliente) e nunca lançam para a UI.
import { revalidatePath } from "next/cache"

import { ErroOportunidades, removerOportunidade, salvarOportunidade } from "@/lib/oportunidades/repositorio"
import { entradaOportunidadeSchema } from "@/lib/oportunidades/tipos"

export type ResultadoOportunidade = { ok: true } | { ok: false; mensagem: string }

function falha(erro: unknown): ResultadoOportunidade {
  if (erro instanceof ErroOportunidades) return { ok: false, mensagem: erro.message }
  console.error("[oportunidades]", erro)
  return { ok: false, mensagem: "Não foi possível salvar. Tente de novo." }
}

export async function salvarOportunidadeAction(entrada: unknown): Promise<ResultadoOportunidade> {
  const r = entradaOportunidadeSchema.safeParse(entrada)
  if (!r.success) return { ok: false, mensagem: "Dados inválidos. Confira lead, oportunidade e valor." }
  try {
    await salvarOportunidade(r.data)
    revalidatePath("/oportunidades")
    return { ok: true }
  } catch (erro) {
    return falha(erro)
  }
}

export async function removerOportunidadeAction(id: unknown): Promise<ResultadoOportunidade> {
  if (typeof id !== "string") return { ok: false, mensagem: "Identificador inválido." }
  try {
    await removerOportunidade(id)
    revalidatePath("/oportunidades")
    return { ok: true }
  } catch (erro) {
    return falha(erro)
  }
}
