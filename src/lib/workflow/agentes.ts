// src/lib/workflow/agentes.ts
// Lista os agentes definidos em agents/*.md (só front matter) e cruza com as tarefas do quadro.
import matter from "gray-matter";
import { promises as fs } from "node:fs";
import path from "node:path";
import { agenteSchema, type Agente } from "@/lib/content/agentes";
import type { Tarefa } from "@/lib/workflow/tipos";

export type AgenteResumo = Pick<Agente, "nome" | "papel" | "descricao" | "le" | "escreve" | "skills">;

/** Pasta dos agentes: BUSINESSOS_AGENTS_DIR ou ./agents. */
function pastaAgentes(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.BUSINESSOS_AGENTS_DIR || path.join(process.cwd(), "agents"));
}

/** Lê agents/*.md. Arquivo inválido é ignorado (a validação fica em npm run content:validate). */
export async function listarAgentes(): Promise<AgenteResumo[]> {
  const pasta = pastaAgentes();
  let arquivos: string[];
  try {
    arquivos = (await fs.readdir(pasta)).filter((a) => a.endsWith(".md")).sort();
  } catch {
    return [];
  }
  const agentes: AgenteResumo[] = [];
  for (const arquivo of arquivos) {
    try {
      const { data } = matter(await fs.readFile(path.join(pasta, arquivo), "utf8"));
      const r = agenteSchema.safeParse(data);
      if (r.success && r.data.nome === arquivo.replace(/\.md$/, "")) {
        agentes.push({
          nome: r.data.nome,
          papel: r.data.papel,
          descricao: r.data.descricao,
          le: r.data.le,
          escreve: r.data.escreve,
          skills: r.data.skills,
        });
      }
    } catch {
      // YAML inválido: ignora
    }
  }
  return agentes;
}

export interface SituacaoAgente extends AgenteResumo {
  /** Tarefas em andamento (coluna "Trabalhando"). Vazio = ocioso. */
  emAndamento: Tarefa[];
  naFila: number;
  emRevisao: number;
}

/** Junta cada agente com suas tarefas. Tarefa de agente sem arquivo em agents/ não aparece aqui (mas aparece no quadro). */
export function situacaoDosAgentes(agentes: AgenteResumo[], tarefas: Tarefa[]): SituacaoAgente[] {
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
