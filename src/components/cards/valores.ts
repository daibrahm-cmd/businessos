// Utilitários puros de UI para valores de campos e datas (sem estado, sem React).
import type { FieldDef } from "@/lib/content/schemas/field-types"
import type { ValorCampo } from "@/lib/content/types"

/** Mesmo valor de DATA_EPOCA (schemas/build.ts): documento que nunca foi salvo. */
const DATA_NUNCA_SALVO = "1970-01-01T00:00:00.000Z"

/** Campo vazio para a UI: texto em branco, lista sem itens ou null. */
export function estaVazio(valor: ValorCampo | undefined): boolean {
  if (valor === null || valor === undefined) return true
  if (typeof valor === "string") return valor.trim() === ""
  if (Array.isArray(valor)) return valor.length === 0
  return false
}

/** Comparação profunda de valores de campo (listas por elemento). */
export function valoresIguais(a: ValorCampo | undefined, b: ValorCampo | undefined): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
    return a.every((v, i) => v === b[i])
  }
  return (a ?? null) === (b ?? null)
}

/** Rótulo da opção escolhida em um campo de seleção (ou o próprio valor, se desconhecido). */
export function rotuloDaOpcao(campo: FieldDef, valor: ValorCampo | undefined): string | null {
  if (campo.tipo !== "selecao" || typeof valor !== "string" || valor === "") return null
  return campo.opcoes.find((o) => o.valor === valor)?.rotulo ?? valor
}

/** true quando a data ISO é a marca de "nunca salvo". */
export function nuncaSalvo(atualizadoEm: string): boolean {
  return atualizadoEm === DATA_NUNCA_SALVO
}

// Fuso fixo (mesmo de FUSO_PADRAO em format.ts): servidor e cliente formatam igual, sem erro de hidratação
const DATA_CURTA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

/** "2026-11-08T14:32:10.000Z" → "08/11/2026" (no fuso de São Paulo). */
export function formatarDataCurta(iso: string): string {
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? iso : DATA_CURTA.format(data)
}

/** "humano" → "você"; "agente:estrategista" → "agente estrategista". */
export function autorLegivel(autor: string): string {
  if (autor === "humano") return "você"
  return autor.startsWith("agente:") ? `agente ${autor.slice("agente:".length)}` : autor
}

const DATA_EXTENSA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "numeric",
  month: "short",
  year: "numeric",
})

/** "2026-11-08T14:32:10.000Z" → "8 de nov. de 2026" (fuso de São Paulo). */
export function formatarDataExtensa(iso: string): string {
  const data = new Date(iso)
  return Number.isNaN(data.getTime()) ? iso : DATA_EXTENSA.format(data)
}
