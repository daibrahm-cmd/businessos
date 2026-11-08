// src/lib/content/resumos.ts
// Indicadores calculados sobre os itens de uma coleção (contagem, soma, saldo) e ordenação de exibição.
import type { CollectionDef, ResumoDef } from "@/lib/content/schemas/field-types";
import type { ContentDoc, Item, ResumoCalculado } from "@/lib/content/types";

const arredondar = (v: number) => Math.round(v * 100) / 100;
const numeroOuZero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function filtrar(itens: Item[], filtro?: { campo: string; valor: string }): Item[] {
  return filtro ? itens.filter((i) => i[filtro.campo] === filtro.valor) : itens;
}

function calcularUm(doc: ContentDoc, itens: Item[], colecao: CollectionDef, resumo: ResumoDef): ResumoCalculado {
  const selecionados = filtrar(itens, resumo.filtro);
  switch (resumo.tipo) {
    case "contagem":
      return { rotulo: resumo.rotulo, valor: selecionados.length, formato: "numero" };
    case "soma": {
      const campo = colecao.campos.find((c) => c.nome === resumo.campo);
      const soma = selecionados.reduce((acc, i) => acc + numeroOuZero(i[resumo.campo]), 0);
      return { rotulo: resumo.rotulo, valor: arredondar(soma), formato: campo?.tipo === "moeda" ? "moeda" : "numero" };
    }
    case "saldo": {
      let saldo = resumo.campoBase ? numeroOuZero(doc.campos[resumo.campoBase]) : 0;
      for (const i of selecionados) {
        if (i[resumo.campoTipo] === resumo.entrada) saldo += numeroOuZero(i[resumo.campo]);
        else if (i[resumo.campoTipo] === resumo.saida) saldo -= numeroOuZero(i[resumo.campo]);
      }
      return { rotulo: resumo.rotulo, valor: arredondar(saldo), formato: "moeda" };
    }
  }
}

/** Resumos da coleção na ordem da definição (filtro por igualdade estrita; valores a 2 casas). */
export function calcularResumos(doc: ContentDoc, colecao: CollectionDef): ResumoCalculado[] {
  const itens = doc.itens.filter((i) => i.colecao === colecao.nome);
  return (colecao.resumos ?? []).map((r) => calcularUm(doc, itens, colecao, r));
}

/** Compara dois valores de campo; vazios (null, "", []) sempre vão para o fim. */
function compararValores(a: unknown, b: unknown): number {
  const vazio = (v: unknown) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
  if (vazio(a) || vazio(b)) return vazio(a) === vazio(b) ? 0 : vazio(a) ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR");
}

/**
 * Itens de uma coleção na ordem de exibição (`ordenarPor`; sem ele, a ordem do arquivo).
 * Não altera a ordem gravada. Vazios ficam no fim em qualquer direção; empate mantém a ordem do arquivo.
 */
export function ordenarItensParaExibicao(itens: readonly Item[], colecao: CollectionDef): Item[] {
  const daColecao = itens.filter((i) => i.colecao === colecao.nome);
  const ordem = colecao.ordenarPor;
  if (!ordem) return daColecao;
  const sinal = ordem.direcao === "desc" ? -1 : 1;
  return daColecao
    .map((item, posicao) => ({ item, posicao }))
    .sort((x, y) => {
      const a = x.item[ordem.campo];
      const b = y.item[ordem.campo];
      const vazioA = a === null || a === undefined || a === "";
      const vazioB = b === null || b === undefined || b === "";
      const comparacao = vazioA || vazioB ? compararValores(a, b) : sinal * compararValores(a, b);
      return comparacao || x.posicao - y.posicao;
    })
    .map(({ item }) => item);
}
