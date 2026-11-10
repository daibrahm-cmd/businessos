// src/lib/workflow/regras.ts
// Regras de negócio das tarefas, independentes de onde os dados são guardados (fs ou Supabase).
import type { EntradaTarefa, Tarefa } from "@/lib/workflow/tipos";

/** Mantém no máximo N tarefas; ao passar disso, descarta as concluídas mais antigas. */
export const LIMITE_TAREFAS = 200;

export class ErroWorkflow extends Error {
  constructor(
    readonly codigo: "NAO_ENCONTRADO" | "PAYLOAD_INVALIDO" | "ARQUIVO_INVALIDO",
    mensagem: string,
  ) {
    super(mensagem);
  }
}

/** Contrato dos dois backends. Cada um cuida da própria atomicidade/concorrência. */
export interface RepositorioTarefas {
  ler(): Promise<Tarefa[]>;
  salvar(entrada: EntradaTarefa, agora: Date): Promise<Tarefa>;
}

/**
 * Cria (existente indefinido) ou atualiza uma tarefa. Criar exige `titulo`.
 * Campos não enviados ficam como estão; `nota: null` limpa a nota.
 */
export function montarTarefa(
  existente: Tarefa | undefined,
  entrada: EntradaTarefa,
  iso: string,
  gerarId: () => string,
): Tarefa {
  if (entrada.id && !existente && !entrada.titulo) {
    throw new ErroWorkflow("NAO_ENCONTRADO", `Tarefa não encontrada: ${entrada.id}. Para criar, envie "titulo".`);
  }
  if (existente) {
    return {
      ...existente,
      agente: entrada.agente,
      titulo: entrada.titulo ?? existente.titulo,
      status: entrada.status ?? existente.status,
      docs: entrada.docs ?? existente.docs,
      nota: entrada.nota === null ? undefined : (entrada.nota ?? existente.nota),
      atualizado_em: iso,
    };
  }
  if (!entrada.titulo) throw new ErroWorkflow("PAYLOAD_INVALIDO", 'Para criar uma tarefa envie "titulo".');
  return {
    id: entrada.id ?? gerarId(),
    agente: entrada.agente,
    titulo: entrada.titulo,
    status: entrada.status ?? "fila",
    docs: entrada.docs ?? [],
    nota: entrada.nota ?? undefined,
    criado_em: iso,
    atualizado_em: iso,
  };
}

/** Ids a descartar quando passa do limite: as concluídas mais antigas (por atualizado_em). */
export function idsParaDescartar(tarefas: Pick<Tarefa, "id" | "status" | "atualizado_em">[]): string[] {
  const excesso = tarefas.length - LIMITE_TAREFAS;
  if (excesso <= 0) return [];
  return tarefas
    .filter((t) => t.status === "concluida")
    .sort((a, b) => a.atualizado_em.localeCompare(b.atualizado_em))
    .slice(0, excesso)
    .map((t) => t.id);
}
