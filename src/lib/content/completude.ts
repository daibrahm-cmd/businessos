// src/lib/content/completude.ts
// Quanto de uma página está preenchido: campos com valor + coleções com ao menos um item.
import type { FieldDef, PageDefinition } from "@/lib/content/schemas/field-types";
import type { Completude, ContentDoc } from "@/lib/content/types";

/** Um campo conta como preenchido se: texto não vazio (após trim), lista com itens, demais !== null. */
export function campoPreenchido(campo: FieldDef, valor: unknown): boolean {
  if (valor === null || valor === undefined) return false;
  switch (campo.tipo) {
    case "texto-curto":
    case "texto-longo":
      return typeof valor === "string" && valor.trim() !== "";
    case "lista-texto":
      return Array.isArray(valor) && valor.length > 0;
    default:
      return true;
  }
}

export function calcularCompletude(doc: ContentDoc, def: PageDefinition): Completude {
  const colecoes = def.colecoes ?? [];
  const total = def.campos.length + colecoes.length;
  let preenchidos = def.campos.filter((c) => campoPreenchido(c, doc.campos[c.nome])).length;
  preenchidos += colecoes.filter((col) => doc.itens.some((i) => i.colecao === col.nome)).length;
  return {
    preenchidos,
    total,
    percentual: total ? Math.round((100 * preenchidos) / total) : 0,
  };
}
