// src/lib/content/api/corpo-put.ts
// Schema e leitura do corpo do PUT /api/context/[secao]/[pagina] (§6.3).
import { z } from "zod";
import { ErroConteudo, detalhesDoZod } from "@/lib/content/errors";
import { RE_AUTOR_AGENTE, dataHoraSchema } from "@/lib/content/schemas/base";
import { CHAVES_PATCH, criarFormaPatch, refinarPatch } from "@/lib/content/schemas/build";
import type { PageDefinition } from "@/lib/content/schemas";
import type { DocPatch } from "@/lib/content/types";

/** Limite do corpo da requisição: 256 KiB. */
export const LIMITE_CORPO_BYTES = 262_144;

/** Corpo do PUT já validado: patch + autor + precondição opcional. */
export interface CorpoPutValidado {
  patch: DocPatch;
  autor: `agente:${string}`;
  esperadoAtualizadoEm?: string;
}

/** Chaves somente-leitura aceitas e ignoradas (permitem reenviar um documento obtido por GET). */
const CHAVES_IGNORADAS = [
  "id",
  "secao",
  "pagina",
  "titulo",
  "descricao",
  "estagio",
  "atualizado_em",
  "extras",
] as const;

/** Schema estrito do corpo do PUT para a página `def`. */
export function criarSchemaCorpoPut(def: PageDefinition) {
  const ignoradas = Object.fromEntries(CHAVES_IGNORADAS.map((c) => [c, z.unknown().optional()])) as Record<
    (typeof CHAVES_IGNORADAS)[number],
    z.ZodOptional<z.ZodUnknown>
  >;

  return z
    .strictObject({
      ...criarFormaPatch(def),
      atualizado_por: z.string().regex(RE_AUTOR_AGENTE, 'Use "agente:<nome>".'),
      esperado_atualizado_em: dataHoraSchema.optional(),
      ...ignoradas,
    })
    .superRefine((corpo, ctx) => {
      // "Pelo menos uma chave" considera só as chaves do DocPatch (refinarPatch já faz isso).
      refinarPatch(corpo, ctx);
      const divergentes: [string, unknown, string][] = [
        ["id", corpo.id, def.id],
        ["secao", corpo.secao, def.secao],
        ["pagina", corpo.pagina, def.pagina],
      ];
      for (const [chave, enviado, esperado] of divergentes) {
        if (enviado !== undefined && enviado !== esperado) {
          ctx.addIssue({ code: "custom", path: [chave], message: "O id do corpo não corresponde à URL." });
        }
      }
    });
}

/**
 * Valida o corpo já parseado e separa patch, autor e precondição.
 * Falha → ErroConteudo PAYLOAD_INVALIDO com detalhes por caminho.
 */
export function validarCorpoPut(def: PageDefinition, corpo: unknown): CorpoPutValidado {
  const resultado = criarSchemaCorpoPut(def).safeParse(corpo);
  if (!resultado.success) {
    throw new ErroConteudo(
      "PAYLOAD_INVALIDO",
      `Dados inválidos para a página ${def.id}.`,
      detalhesDoZod(resultado.error.issues),
    );
  }
  const dados = resultado.data as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const chave of CHAVES_PATCH) {
    if (dados[chave] !== undefined) patch[chave] = dados[chave];
  }
  return {
    patch: patch as DocPatch,
    autor: resultado.data.atualizado_por as `agente:${string}`,
    esperadoAtualizadoEm: resultado.data.esperado_atualizado_em as string | undefined,
  };
}
