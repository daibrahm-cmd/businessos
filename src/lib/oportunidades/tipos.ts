// src/lib/oportunidades/tipos.ts
// Oportunidades de venda dos leads, organizadas num funil Kanban.
import { z } from "zod";

/** Colunas do funil, na ordem do fluxo. */
// Mesmos valores do estágio dos leads (validacao/leads), para a oportunidade herdar o estágio do lead.
export const ESTAGIOS = ["novo", "contatado", "qualificado", "em-negociacao", "ganho", "perdido"] as const;
export const estagioSchema = z.enum(ESTAGIOS);
export type Estagio = z.infer<typeof estagioSchema>;

export const ROTULOS_ESTAGIO: Record<Estagio, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  "em-negociacao": "Em negociação",
  ganho: "Ganho",
  perdido: "Perdido",
};

export const RE_ID_OPORTUNIDADE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

/** Oportunidade gravada em oportunidades/oportunidades.json. */
export const oportunidadeSchema = z.strictObject({
  id: z.string().regex(RE_ID_OPORTUNIDADE),
  lead: z.string().trim().min(1).max(120), // pessoa ou contato
  empresa: z.string().trim().max(120).optional(),
  titulo: z.string().trim().min(1).max(160), // o que está sendo vendido
  valor: z.number().min(0).max(1_000_000_000).optional(), // em R$
  estagio: estagioSchema,
  contato: z.string().trim().max(160).optional(), // e-mail, telefone ou @
  proximo_passo: z.string().trim().max(300).optional(),
  lead_id: z.string().trim().min(1).max(64).optional(), // id do item em validacao/leads (copiado uma vez)
  criado_em: z.iso.datetime(),
  atualizado_em: z.iso.datetime(),
});
export type Oportunidade = z.infer<typeof oportunidadeSchema>;

/** Entrada para criar (sem id) ou atualizar (com id). `null` limpa um campo opcional. */
export const entradaOportunidadeSchema = z.strictObject({
  id: z.string().regex(RE_ID_OPORTUNIDADE).optional(),
  lead: z.string().trim().min(1).max(120).optional(),
  empresa: z.string().trim().max(120).nullable().optional(),
  titulo: z.string().trim().min(1).max(160).optional(),
  valor: z.number().min(0).max(1_000_000_000).nullable().optional(),
  estagio: estagioSchema.optional(),
  contato: z.string().trim().max(160).nullable().optional(),
  proximo_passo: z.string().trim().max(300).nullable().optional(),
  lead_id: z.string().trim().min(1).max(64).nullable().optional(),
});
export type EntradaOportunidade = z.infer<typeof entradaOportunidadeSchema>;

export const arquivoOportunidadesSchema = z.strictObject({ oportunidades: z.array(oportunidadeSchema) });
