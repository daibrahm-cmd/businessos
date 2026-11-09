"use server"
// Server Action do Workflow: a fundadora move uma tarefa de coluna arrastando o card.
// Nunca lança para a UI; devolve { ok } ou a mensagem do erro.
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { ErroWorkflow, lerTarefas, salvarTarefa } from "@/lib/workflow/repositorio"
import { RE_ID_TAREFA, statusTarefaSchema } from "@/lib/workflow/tipos"

export type ResultadoMoverTarefa = { ok: true } | { ok: false; mensagem: string }

const entradaSchema = z.strictObject({ id: z.string().regex(RE_ID_TAREFA), status: statusTarefaSchema })

export async function moverTarefaAction(entrada: unknown): Promise<ResultadoMoverTarefa> {
  const r = entradaSchema.safeParse(entrada)
  if (!r.success) return { ok: false, mensagem: "Dados inválidos." }
  try {
    const tarefa = (await lerTarefas()).find((t) => t.id === r.data.id)
    if (!tarefa) return { ok: false, mensagem: "Tarefa não encontrada." }
    // Move em nome do agente dono da tarefa (a regra "agente só mexe na própria tarefa" continua valendo)
    await salvarTarefa({ id: tarefa.id, agente: tarefa.agente, status: r.data.status })
    revalidatePath("/workflow")
    return { ok: true }
  } catch (erro) {
    if (erro instanceof ErroWorkflow) return { ok: false, mensagem: erro.message }
    console.error("[workflow]", erro)
    return { ok: false, mensagem: "Não foi possível mover. Tente de novo." }
  }
}
