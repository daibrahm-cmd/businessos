"use server"
// Server Action do briefing: gera um novo e devolve o resultado (nunca lança para o cliente).
import { revalidatePath } from "next/cache"

import { gerarBriefing, type BriefingSalvo } from "@/lib/briefing/briefing"

export type ResultadoBriefing = { ok: true; briefing: BriefingSalvo } | { ok: false; mensagem: string }

export async function gerarBriefingAction(): Promise<ResultadoBriefing> {
  try {
    const briefing = await gerarBriefing()
    revalidatePath("/briefing")
    return { ok: true, briefing }
  } catch (erro) {
    console.error("[briefing] falha ao gerar", erro)
    return { ok: false, mensagem: erro instanceof Error ? erro.message : "Não foi possível gerar o briefing." }
  }
}
