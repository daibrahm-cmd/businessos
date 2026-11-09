// src/lib/content/agentes.ts
// Schemas do front matter de agents/<nome>.md e skills/<nome>/SKILL.md (usados por npm run content:validate).
import matter from "gray-matter";
import { z } from "zod";
import { detalhesDoZod, type DetalheErro } from "@/lib/content/errors";
import { docIdSchema } from "@/lib/content/schemas/base";

export const RE_NOME_AGENTE = /^[a-z0-9][a-z0-9-]{0,62}$/;
export const RE_NOME_SKILL = /^[a-z0-9][a-z0-9-]*$/;

/** Front matter de agents/<nome>.md (§10.2). */
export const agenteSchema = z.strictObject({
  nome: z.string().regex(RE_NOME_AGENTE), // = nome do arquivo sem .md
  apelido: z.string().trim().min(1).max(40).optional(), // nome de exibição na interface (ex.: "Frida")
  papel: z.string().min(1).max(120),
  descricao: z.string().min(1).max(300),
  le: z.array(docIdSchema).min(1),
  escreve: z.array(docIdSchema).default([]),
  skills: z.array(z.string().regex(RE_NOME_SKILL)).default([]), // cada uma deve existir em skills/<nome>/SKILL.md
});
export type Agente = z.infer<typeof agenteSchema>;

/** Front matter de skills/<nome>/SKILL.md (§10.3): chaves em inglês exigidas pelas ferramentas. */
export const skillSchema = z.looseObject({
  name: z.string().regex(RE_NOME_SKILL), // = nome da pasta
  description: z.string().trim().min(1).max(1024),
});
export type Skill = z.infer<typeof skillSchema>;

function lerFrontmatter(conteudo: string): { dados?: unknown; corpo: string; erro?: string } {
  try {
    const arquivo = matter(conteudo.replace(/^﻿/, ""), {});
    return { dados: structuredClone(arquivo.data), corpo: arquivo.content };
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message.split("\n")[0] : String(erro);
    return { corpo: "", erro: `YAML inválido: ${motivo}` };
  }
}

/**
 * Valida o conteúdo de agents/<nomeArquivo>.md.
 * `skillsExistentes`: nomes das pastas em skills/ que têm SKILL.md.
 */
export function validarArquivoAgente(
  conteudo: string,
  nomeArquivo: string,
  skillsExistentes: ReadonlySet<string>,
): DetalheErro[] {
  const { dados, corpo, erro } = lerFrontmatter(conteudo);
  if (erro) return [{ caminho: "", mensagem: erro }];
  const r = agenteSchema.safeParse(dados);
  if (!r.success) return detalhesDoZod(r.error.issues);

  const detalhes: DetalheErro[] = [];
  if (r.data.nome !== nomeArquivo) {
    detalhes.push({ caminho: "nome", mensagem: `nome deve ser igual ao nome do arquivo (${nomeArquivo}).` });
  }
  r.data.skills.forEach((skill, i) => {
    if (!skillsExistentes.has(skill)) {
      detalhes.push({ caminho: `skills.${i}`, mensagem: `Skill inexistente: skills/${skill}/SKILL.md.` });
    }
  });
  if (corpo.trim() === "") detalhes.push({ caminho: "corpo", mensagem: "O agente precisa de instruções no corpo." });
  return detalhes;
}

/** Valida o conteúdo de skills/<nomePasta>/SKILL.md. */
export function validarArquivoSkill(conteudo: string, nomePasta: string): DetalheErro[] {
  const { dados, corpo, erro } = lerFrontmatter(conteudo);
  if (erro) return [{ caminho: "", mensagem: erro }];
  const r = skillSchema.safeParse(dados);
  if (!r.success) return detalhesDoZod(r.error.issues);

  const detalhes: DetalheErro[] = [];
  if (r.data.name !== nomePasta) {
    detalhes.push({ caminho: "name", mensagem: `name deve ser igual ao nome da pasta (${nomePasta}).` });
  }
  if (corpo.trim() === "") detalhes.push({ caminho: "corpo", mensagem: "A skill precisa de instruções no corpo." });
  return detalhes;
}
