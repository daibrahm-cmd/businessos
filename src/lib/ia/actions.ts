"use server"
// Server Actions dos botões de IA do editor: validam o id (vem do cliente) e nunca lançam para a UI.
import { ehIdValido } from "@/lib/content/navigation"
import type { ValorCampo } from "@/lib/content/types"
import { gerarRelatorio, sugerirCampos } from "@/lib/ia/pagina"

export type ResultadoSugestao = { ok: true; campos: Record<string, ValorCampo> } | { ok: false; mensagem: string }
export type ResultadoRelatorio = { ok: true; texto: string } | { ok: false; mensagem: string }

function mensagem(erro: unknown): string {
  console.error("[ia]", erro)
  return erro instanceof Error ? erro.message : "Não foi possível falar com a IA."
}

export async function pedirIAAction(id: string): Promise<ResultadoSugestao> {
  if (!ehIdValido(id)) return { ok: false, mensagem: "Página não encontrada." }
  try {
    return { ok: true, campos: await sugerirCampos(id) }
  } catch (erro) {
    return { ok: false, mensagem: mensagem(erro) }
  }
}

export async function gerarRelatorioAction(id: string): Promise<ResultadoRelatorio> {
  if (!ehIdValido(id)) return { ok: false, mensagem: "Página não encontrada." }
  try {
    return { ok: true, texto: await gerarRelatorio(id) }
  } catch (erro) {
    return { ok: false, mensagem: mensagem(erro) }
  }
}
