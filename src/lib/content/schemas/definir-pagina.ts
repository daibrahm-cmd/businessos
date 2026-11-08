// src/lib/content/schemas/definir-pagina.ts
// Monta uma PageDefinition pegando título/descrição da navegação (fonte única).
import { obterPagina, separarId, type DocId } from "@/lib/content/navigation";
import type { OpcaoSelecao, PageDefinition } from "@/lib/content/schemas/field-types";

/** Nível genérico (atratividade, confiança). */
export const OPCOES_NIVEL = [
  { valor: "baixo", rotulo: "Baixo" },
  { valor: "medio", rotulo: "Médio" },
  { valor: "alto", rotulo: "Alto" },
] as const satisfies readonly OpcaoSelecao[];

/** Frequência de um problema. */
export const OPCOES_FREQUENCIA = [
  { valor: "diaria", rotulo: "Diária" },
  { valor: "semanal", rotulo: "Semanal" },
  { valor: "mensal", rotulo: "Mensal" },
  { valor: "eventual", rotulo: "Eventual" },
] as const satisfies readonly OpcaoSelecao[];

/** Tipo de lançamento de caixa. */
export const OPCOES_TIPO_LANCAMENTO = [
  { valor: "entrada", rotulo: "Entrada" },
  { valor: "saida", rotulo: "Saída" },
] as const satisfies readonly OpcaoSelecao[];

export function definirPagina(
  id: DocId,
  def: Omit<PageDefinition, "id" | "secao" | "pagina" | "titulo" | "descricao">,
): PageDefinition {
  const { secao, pagina } = separarId(id);
  const nav = obterPagina(id);
  return {
    id,
    secao,
    pagina,
    titulo: nav.pagina.titulo,
    descricao: nav.pagina.descricao,
    ...def,
  };
}
