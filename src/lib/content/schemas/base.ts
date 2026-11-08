// src/lib/content/schemas/base.ts
// Schema zod do front matter comum a todas as páginas do BusinessOS.
import { z } from "zod";
import {
  ESTAGIOS,
  ehIdValido,
  ehSecaoValida,
  type DocId,
  type SecaoSlug,
} from "@/lib/content/navigation";

// Mensagens padrão do zod em português (§5.3). Mensagens customizadas abaixo têm precedência.
z.config(z.locales.pt());

/** Status possíveis de um documento, na ordem do fluxo de trabalho. */
export const STATUS = ["vazio", "rascunho", "em-validacao", "validado"] as const;
export const statusSchema = z.enum(STATUS);

/** Regex do autor de uma alteração: "humano" ou "agente:<nome>". */
export const RE_AUTOR = /^(humano|agente:[a-z0-9][a-z0-9-]{0,62})$/;
export const RE_AUTOR_AGENTE = /^agente:[a-z0-9][a-z0-9-]{0,62}$/;
export const autorSchema = z
  .string()
  .regex(RE_AUTOR, 'Use "humano" ou "agente:<nome>" (minúsculas, números e hífen).');

/** Slug kebab-case usado em páginas e seções. */
export const RE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Id de item de coleção. */
export const RE_ITEM_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const itemIdSchema = z.string().regex(RE_ITEM_ID, "Id de item inválido.");

/** Id de documento: só aceita ids que existem na navegação. */
export const docIdSchema = z.custom<DocId>((v) => ehIdValido(v), {
  message: "Id de documento inexistente na navegação.",
});

export const secaoSchema = z.custom<SecaoSlug>((v) => ehSecaoValida(v), {
  message: "Seção inexistente na navegação.",
});

/** Data e hora ISO 8601; aceita Date vindo do YAML e converte para string. */
export const dataHoraSchema = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString() : v),
  z.iso.datetime({ offset: true }),
);

/** Tags livres, aparadas, sem duplicatas. */
export const tagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(20)
  .transform((tags) => [...new Set(tags)]);

/** Item genérico de coleção (antes da validação específica da página). */
export const itemBaseSchema = z.looseObject({
  id: itemIdSchema,
  colecao: z.string().regex(/^[a-z][a-z0-9_]*$/),
});

/** Shape do front matter comum — reutilizado por criarSchemaDocumento(). */
export const baseFrontmatterShape = {
  id: docIdSchema,
  secao: secaoSchema,
  pagina: z.string().regex(RE_SLUG),
  titulo: z.string().min(1).max(120),
  descricao: z.string().max(300),
  estagio: z.enum(ESTAGIOS).default("para-quem-esta-comecando"),
  status: statusSchema.default("vazio"),
  atualizado_em: dataHoraSchema,
  atualizado_por: autorSchema,
  tags: tagsSchema.default([]),
  relacionados: z.array(docIdSchema).max(11).default([]),
  campos: z.record(z.string(), z.unknown()).default({}),
  itens: z.array(itemBaseSchema).default([]),
};

/** Regras que cruzam chaves do front matter. */
export function refinarFrontmatter(
  fm: { id: string; secao: string; pagina: string; relacionados: string[]; itens: { id: string }[] },
  ctx: z.RefinementCtx,
) {
  if (fm.id !== `${fm.secao}/${fm.pagina}`) {
    ctx.addIssue({ code: "custom", path: ["id"], message: "id deve ser igual a <secao>/<pagina>." });
  }
  if (fm.relacionados.includes(fm.id)) {
    ctx.addIssue({ code: "custom", path: ["relacionados"], message: "Um documento não pode se relacionar consigo mesmo." });
  }
  if (new Set(fm.relacionados).size !== fm.relacionados.length) {
    ctx.addIssue({ code: "custom", path: ["relacionados"], message: "Há ids repetidos em relacionados." });
  }
  const ids = fm.itens.map((i) => i.id);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: "custom", path: ["itens"], message: "Há itens com id repetido." });
  }
}

/** Front matter comum, sem validação específica de campos/itens da página. */
export const baseFrontmatterSchema = z
  .looseObject(baseFrontmatterShape)
  .superRefine(refinarFrontmatter);

export type BaseFrontmatter = z.infer<typeof baseFrontmatterSchema>;
