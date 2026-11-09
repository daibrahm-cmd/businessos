// src/lib/workflow/agentes.ts
// Lê e edita os agentes definidos em agents/*.md e cruza com as tarefas do quadro.
import matter from "gray-matter";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { agenteSchema, type Agente } from "@/lib/content/agentes";
import type { Tarefa } from "@/lib/workflow/tipos";

export type AgenteResumo = Pick<Agente, "nome" | "apelido" | "papel" | "descricao" | "le" | "escreve" | "skills">;
/** Agente com as instruções (corpo do .md); usado só no modal de edição. */
export type AgenteCompleto = AgenteResumo & { instrucoes: string };

/** Pasta dos agentes: BUSINESSOS_AGENTS_DIR ou ./agents. */
function pastaAgentes(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.BUSINESSOS_AGENTS_DIR || path.join(process.cwd(), "agents"));
}

/** Nome para mostrar na interface: o apelido, ou o nome técnico. */
export function nomeExibido(a: Pick<AgenteResumo, "nome" | "apelido">): string {
  return a.apelido ?? a.nome;
}

/** Lê agents/*.md. Arquivo inválido é ignorado (a validação fica em npm run content:validate). */
export async function listarAgentesCompletos(): Promise<AgenteCompleto[]> {
  const pasta = pastaAgentes();
  let arquivos: string[];
  try {
    arquivos = (await fs.readdir(pasta)).filter((a) => a.endsWith(".md")).sort();
  } catch {
    return [];
  }
  const agentes: AgenteCompleto[] = [];
  for (const arquivo of arquivos) {
    try {
      const { data, content } = matter(await fs.readFile(path.join(pasta, arquivo), "utf8"));
      const r = agenteSchema.safeParse(data);
      if (r.success && r.data.nome === arquivo.replace(/\.md$/, "")) {
        agentes.push({
          nome: r.data.nome,
          apelido: r.data.apelido,
          papel: r.data.papel,
          descricao: r.data.descricao,
          le: r.data.le,
          escreve: r.data.escreve,
          skills: r.data.skills,
          instrucoes: content.trim(),
        });
      }
    } catch {
      // YAML inválido: ignora
    }
  }
  return agentes;
}

/** Versão sem as instruções (API e quadro). */
export async function listarAgentes(): Promise<AgenteResumo[]> {
  return (await listarAgentesCompletos()).map((a) => ({
    nome: a.nome,
    apelido: a.apelido,
    papel: a.papel,
    descricao: a.descricao,
    le: a.le,
    escreve: a.escreve,
    skills: a.skills,
  }));
}

export class ErroAgente extends Error {
  constructor(
    readonly codigo: "NAO_ENCONTRADO" | "PAYLOAD_INVALIDO",
    mensagem: string,
  ) {
    super(mensagem);
  }
}

/** Campos editáveis no modal. `nome` (técnico) e `skills` não mudam por aqui. */
export type EdicaoAgente = Pick<AgenteCompleto, "apelido" | "papel" | "descricao" | "le" | "escreve" | "instrucoes">;

/** Texto YAML de uma lista de ids (`[]` quando vazia). */
function listaYaml(chave: string, itens: readonly string[]): string {
  return itens.length === 0 ? `${chave}: []\n` : `${chave}:\n${itens.map((i) => `  - ${i}`).join("\n")}\n`;
}

/**
 * Grava a edição em agents/<nome>.md. Valida com o mesmo schema do `content:validate` antes de escrever
 * e usa escrita atômica (temporário + rename). Textos entram entre aspas (JSON é YAML válido).
 */
export async function salvarAgente(nome: string, edicao: EdicaoAgente): Promise<AgenteCompleto> {
  const atual = (await listarAgentesCompletos()).find((a) => a.nome === nome);
  if (!atual) throw new ErroAgente("NAO_ENCONTRADO", `Agente não encontrado: ${nome}.`);

  const apelido = edicao.apelido?.trim() || undefined;
  const novo: AgenteCompleto = { ...atual, ...edicao, apelido, instrucoes: edicao.instrucoes.trim() };
  const r = agenteSchema.safeParse({
    nome: novo.nome,
    ...(apelido ? { apelido } : {}),
    papel: novo.papel,
    descricao: novo.descricao,
    le: novo.le,
    escreve: novo.escreve,
    skills: novo.skills,
  });
  if (!r.success) throw new ErroAgente("PAYLOAD_INVALIDO", "Dados do agente inválidos. Confira papel, descrição e páginas lidas.");

  const frontMatter =
    `nome: ${novo.nome}\n` +
    (apelido ? `apelido: ${JSON.stringify(apelido)}\n` : "") +
    `papel: ${JSON.stringify(novo.papel.trim())}\n` +
    `descricao: ${JSON.stringify(novo.descricao.trim())}\n` +
    listaYaml("le", novo.le) +
    listaYaml("escreve", novo.escreve) +
    listaYaml("skills", novo.skills);
  const texto = `---\n${frontMatter}---\n\n${novo.instrucoes}\n`;

  const alvo = path.join(pastaAgentes(), `${nome}.md`);
  const temporario = `${alvo}.${randomUUID()}.tmp`;
  await fs.writeFile(temporario, texto, "utf8");
  await fs.rename(temporario, alvo);
  return novo;
}

export interface SituacaoAgente extends AgenteResumo {
  /** Tarefas em andamento (coluna "Trabalhando"). Vazio = ocioso. */
  emAndamento: Tarefa[];
  naFila: number;
  emRevisao: number;
}

/** Junta cada agente com suas tarefas. Tarefa de agente sem arquivo em agents/ não aparece aqui (mas aparece no quadro). */
export function situacaoDosAgentes<T extends AgenteResumo>(
  agentes: T[],
  tarefas: Tarefa[],
): (T & Omit<SituacaoAgente, keyof AgenteResumo>)[] {
  return agentes.map((a) => {
    const minhas = tarefas.filter((t) => t.agente === a.nome);
    return {
      ...a,
      emAndamento: minhas.filter((t) => t.status === "trabalhando"),
      naFila: minhas.filter((t) => t.status === "fila").length,
      emRevisao: minhas.filter((t) => t.status === "revisao").length,
    };
  });
}
