// src/lib/content/schemas/build.ts
// Deriva schemas zod, valores padrão e o template de arquivo a partir da definição declarativa da página.
import { z } from "zod";
import {
  baseFrontmatterShape,
  docIdSchema,
  itemIdSchema,
  refinarFrontmatter,
  statusSchema,
  tagsSchema,
} from "@/lib/content/schemas/base";
import type { CollectionDef, FieldDef, PageDefinition } from "@/lib/content/schemas/field-types";
import { ESTAGIO_ATUAL } from "@/lib/content/navigation";
import type { ContentDoc, DocPatch, Item, ValorCampo } from "@/lib/content/types";

/** Marca de "nunca salvo" em atualizado_em. */
export const DATA_EPOCA = "1970-01-01T00:00:00.000Z";

/** Limites padrão (§3.4). */
export const LIMITES = {
  textoCurto: 200,
  textoLongo: 5000,
  listaItens: 50,
  listaCaracteres: 300,
  itensPorColecao: 500,
  itensPorPatch: 100,
  corpo: 100_000,
  corpoAnexar: 20_000,
  relacionados: 11,
} as const;

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const RE_NUMERO_TEXTO = /^-?\d+(\.\d+)?$/;

/** Valor de um campo vazio: texto → "", lista → [], demais → null. */
export function valorPadrao(campo: FieldDef): ValorCampo {
  switch (campo.tipo) {
    case "texto-curto":
    case "texto-longo":
      return "";
    case "lista-texto":
      return [];
    default:
      return null;
  }
}

/** Verdadeiro se "AAAA-MM-DD" é uma data que existe no calendário (recusa 2026-02-30). */
export function ehDataReal(valor: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!m) return false;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

/** Schema "cru" (sem tratamento de null) de cada tipo de campo. */
function schemaDoTipo(campo: FieldDef): z.ZodType<ValorCampo> {
  switch (campo.tipo) {
    case "texto-curto":
      return z.string().trim().max(campo.maxCaracteres ?? LIMITES.textoCurto);
    case "texto-longo":
      // Só remove espaços do fim: quebras de linha e recuo do começo são conteúdo.
      return z
        .string()
        .overwrite((s) => s.trimEnd())
        .max(campo.maxCaracteres ?? LIMITES.textoLongo);
    case "numero": {
      let numero = z.number();
      if (campo.inteiro) numero = numero.int();
      if (campo.min !== undefined) numero = numero.min(campo.min);
      if (campo.max !== undefined) numero = numero.max(campo.max);
      return numero.nullable();
    }
    case "moeda": {
      let moeda = z.number();
      if (campo.min !== undefined) moeda = moeda.min(campo.min);
      if (campo.max !== undefined) moeda = moeda.max(campo.max);
      // Reais com no máximo 2 casas.
      return moeda.transform((v) => Math.round(v * 100) / 100).nullable();
    }
    case "lista-texto":
      return z
        .array(z.string().trim().min(1, "Itens da lista não podem ser vazios.").max(LIMITES.listaCaracteres))
        .max(campo.maxItens ?? LIMITES.listaItens);
    case "selecao": {
      const valores = campo.opcoes.map((o) => o.valor) as [string, ...string[]];
      return z.enum(valores).nullable();
    }
    case "data":
      return z
        .string()
        .regex(RE_DATA, "Use o formato AAAA-MM-DD.")
        .refine(ehDataReal, "Data inexistente.")
        .nullable();
  }
}

/** Schema ESTRITO de escrita (patch da UI e da API). null em qualquer tipo = limpar (vira valorPadrao). */
export function schemaEscritaDoCampo(campo: FieldDef): z.ZodType<ValorCampo> {
  return z.preprocess((v) => (v === null ? valorPadrao(campo) : v), schemaDoTipo(campo));
}

/** Coerções toleradas apenas na leitura de arquivos (§3.4). */
function coagirLeitura(campo: FieldDef, v: unknown): unknown {
  if (v === undefined) return valorPadrao(campo);
  switch (campo.tipo) {
    case "texto-curto":
    case "texto-longo":
      if (typeof v === "number") return String(v);
      if (v === null) return "";
      return v;
    case "numero":
    case "moeda":
      if (typeof v === "string" && RE_NUMERO_TEXTO.test(v.trim())) return Number(v.trim());
      return v;
    case "lista-texto":
      if (v === null) return [];
      if (typeof v === "string") return v.trim() === "" ? [] : [v];
      return v;
    case "selecao":
      return v === "" ? null : v;
    case "data":
      if (v === "") return null;
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      return v;
  }
}

/** Schema TOLERANTE de leitura: aplica as coerções e depois o schema estrito. */
export function schemaLeituraDoCampo(campo: FieldDef): z.ZodType<ValorCampo> {
  return z.preprocess((v) => coagirLeitura(campo, v), schemaEscritaDoCampo(campo));
}

/** Verdadeiro se o valor conta como vazio (texto em branco, lista vazia, null/undefined). */
export function valorVazio(valor: unknown): boolean {
  if (valor === null || valor === undefined) return true;
  if (typeof valor === "string") return valor.trim() === "";
  if (Array.isArray(valor)) return valor.length === 0;
  return false;
}

/** Converte null/undefined do YAML em objeto ou lista vazia (chave vazia no arquivo). */
const vazioParaObjeto = (v: unknown) => (v === null || v === undefined ? {} : v);
const vazioParaLista = (v: unknown) => (v === null || v === undefined ? [] : v);

/** Schema do item como lido do arquivo (tolerante, sem `obrigatorio`). */
function schemaItemLeitura(col: CollectionDef) {
  const forma: Record<string, z.ZodType> = {
    id: itemIdSchema,
    colecao: z.literal(col.nome),
  };
  for (const c of col.campos) forma[c.nome] = schemaLeituraDoCampo(c);
  return z.looseObject(forma);
}

/** Schema de `itens` da página: união discriminada por "colecao" + limite por coleção. */
function schemaItensLeitura(def: PageDefinition): z.ZodType<Item[]> {
  const colecoes = def.colecoes ?? [];
  if (colecoes.length === 0) {
    return z.preprocess(
      vazioParaLista,
      z.array(z.unknown()).max(0, "Esta página não tem coleções."),
    ) as unknown as z.ZodType<Item[]>;
  }
  const opcoes = colecoes.map(schemaItemLeitura) as [
    ReturnType<typeof schemaItemLeitura>,
    ...ReturnType<typeof schemaItemLeitura>[],
  ];
  const lista = z.array(z.discriminatedUnion("colecao", opcoes)).superRefine((itens, ctx) => {
    for (const col of colecoes) {
      const max = col.maxItens ?? LIMITES.itensPorColecao;
      const qtd = itens.filter((i) => i.colecao === col.nome).length;
      if (qtd > max) {
        ctx.addIssue({ code: "custom", path: [], message: `A coleção ${col.rotulo} aceita no máximo ${max} itens.` });
      }
    }
  });
  return z.preprocess(vazioParaLista, lista) as unknown as z.ZodType<Item[]>;
}

/** Front matter completo da página (leitura do arquivo e validação final antes de gravar). */
export function criarSchemaDocumento(def: PageDefinition): z.ZodType<Omit<ContentDoc, "corpo" | "extras">> {
  const formaCampos: Record<string, z.ZodType> = {};
  for (const c of def.campos) formaCampos[c.nome] = schemaLeituraDoCampo(c);
  // looseObject: chaves de `campos` fora da definição são preservadas.
  const campos = z.preprocess(vazioParaObjeto, z.looseObject(formaCampos));
  const schema = z
    .looseObject({
      ...baseFrontmatterShape,
      campos,
      itens: schemaItensLeitura(def),
    })
    .superRefine(refinarFrontmatter);
  return schema as unknown as z.ZodType<Omit<ContentDoc, "corpo" | "extras">>;
}

/** Item depois do merge: todos os campos com valor (padrão quando ausente) e `obrigatorio` aplicado. */
export function criarSchemaItemCompleto(col: CollectionDef): z.ZodType<Item> {
  const forma: Record<string, z.ZodType> = {
    id: itemIdSchema,
    colecao: z.literal(col.nome),
  };
  for (const c of col.campos) {
    let schema: z.ZodType = schemaEscritaDoCampo(c);
    if (c.obrigatorio) {
      schema = schema.refine((v) => !valorVazio(v), { message: `${c.rotulo} é obrigatório.` });
    }
    forma[c.nome] = z.preprocess((v) => (v === undefined ? valorPadrao(c) : v), schema);
  }
  return z.looseObject(forma) as unknown as z.ZodType<Item>;
}

/** Shape do patch (sem refinamentos). Exportado para a API compor o corpo do PUT (§6.3). */
export function criarFormaPatch(def: PageDefinition) {
  const formaCampos: Record<string, z.ZodType> = {};
  for (const c of def.campos) formaCampos[c.nome] = schemaEscritaDoCampo(c).optional();

  const colecoes = def.colecoes ?? [];
  let itens: z.ZodType;
  if (colecoes.length === 0) {
    itens = z.array(z.unknown()).max(0, "Esta página não tem coleções.");
  } else {
    const opcoes = colecoes.map((col) => {
      const forma: Record<string, z.ZodType> = {
        id: itemIdSchema.optional(),
        colecao: z.literal(col.nome),
      };
      for (const c of col.campos) forma[c.nome] = schemaEscritaDoCampo(c).optional();
      return z.strictObject(forma);
    }) as [z.ZodObject, ...z.ZodObject[]];
    itens = z.array(z.discriminatedUnion("colecao", opcoes)).max(LIMITES.itensPorPatch);
  }

  return {
    campos: z.strictObject(formaCampos).optional(),
    itens: itens.optional(),
    itens_remover: z.array(itemIdSchema).max(LIMITES.itensPorPatch).optional(),
    corpo: z.string().max(LIMITES.corpo).optional(),
    corpo_anexar: z.string().min(1).max(LIMITES.corpoAnexar).optional(),
    status: statusSchema.optional(),
    tags: tagsSchema.optional(),
    relacionados: z.array(docIdSchema).max(LIMITES.relacionados).optional(),
  };
}

/** Chaves que contam como alteração em um patch. */
export const CHAVES_PATCH = [
  "campos",
  "itens",
  "itens_remover",
  "corpo",
  "corpo_anexar",
  "status",
  "tags",
  "relacionados",
] as const satisfies readonly (keyof DocPatch)[];

/** Refinamentos do patch: corpo e corpo_anexar não andam juntos; ao menos uma chave do DocPatch. */
export function refinarPatch(patch: Partial<Record<string, unknown>>, ctx: z.RefinementCtx): void {
  if (patch.corpo !== undefined && patch.corpo_anexar !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["corpo_anexar"],
      message: "Envie corpo ou corpo_anexar, não os dois.",
    });
  }
  if (!CHAVES_PATCH.some((chave) => patch[chave] !== undefined)) {
    ctx.addIssue({ code: "custom", path: [], message: "Nada para atualizar." });
  }
}

/** Patch estrito da página: chaves desconhecidas → erro. */
export function criarSchemaPatch(def: PageDefinition): z.ZodType<DocPatch> {
  return z.strictObject(criarFormaPatch(def)).superRefine(refinarPatch) as unknown as z.ZodType<DocPatch>;
}

/** Documento vazio da página (arquivo ainda não criado). */
export function criarTemplate(def: PageDefinition): ContentDoc {
  return {
    id: def.id,
    secao: def.secao,
    pagina: def.pagina,
    titulo: def.titulo,
    descricao: def.descricao,
    estagio: ESTAGIO_ATUAL,
    status: "vazio",
    atualizado_em: DATA_EPOCA,
    atualizado_por: "humano",
    tags: [],
    relacionados: [...def.relacionadosPadrao],
    campos: Object.fromEntries(def.campos.map((c) => [c.nome, valorPadrao(c)])),
    itens: [],
    corpo: "",
    extras: {},
  };
}
