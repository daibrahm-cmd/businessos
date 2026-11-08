// src/lib/format.ts
// Formatação pt-BR de moeda, número e datas. Funções puras, usadas pela UI e pela exportação Markdown.

/** Fuso usado para exibir datas e horas, igual no servidor e no cliente (evita erro de hidratação). */
export const FUSO_PADRAO = "America/Sao_Paulo";

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoNumero = new Intl.NumberFormat("pt-BR");
const formatoDataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_PADRAO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** O Intl usa espaços não separáveis; trocamos por espaço comum para saída previsível (Markdown, testes). */
function normalizarEspacos(texto: string): string {
  return texto.replace(/[  ]/g, " ");
}

/** 1500.5 → "R$ 1.500,50". */
export function formatarMoeda(v: number): string {
  return normalizarEspacos(formatoMoeda.format(v));
}

/** 25 + "h" → "25 h"; 12 + "%" → "12%"; 1234.5 → "1.234,5". */
export function formatarNumero(v: number, unidade?: string): string {
  const numero = normalizarEspacos(formatoNumero.format(v));
  if (!unidade) return numero;
  return unidade === "%" ? `${numero}%` : `${numero} ${unidade}`;
}

/** "2026-11-08" → "08/11/2026". Feito por partes da string, sem new Date(), para não deslocar o fuso. */
export function formatarData(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** "2026-11-08T14:32:10.000Z" → "08/11/2026 às 11:32" (horário de São Paulo). */
export function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  const partes: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const parte of formatoDataHora.formatToParts(data)) partes[parte.type] = parte.value;
  return `${partes.day}/${partes.month}/${partes.year} às ${partes.hour}:${partes.minute}`;
}

/**
 * Converte texto digitado em número.
 * "1.500,50" → 1500.5; "1500.5" → 1500.5; "R$ 10" → 10; vazio → null; inválido → undefined.
 */
export function parsearNumeroBR(texto: string): number | null | undefined {
  let limpo = texto.replace(/R\$/g, "").replace(/\s+/g, "");
  if (limpo === "") return null;
  if (limpo.includes(",")) limpo = limpo.replace(/\./g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(limpo)) return undefined;
  return Number(limpo);
}
