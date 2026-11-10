// src/lib/workflow/repositorio.ts
// API pública das tarefas do Workflow. Escolhe o backend por BUSINESSOS_STORAGE (padrão: supabase; "fs" = JSON local).
// Regras de negócio em regras.ts; persistência em repositorio-fs.ts e repositorio-supabase.ts.
import {
  backendDeArmazenamento,
  resolverAcessoSupabase,
  type OpcoesArmazenamento,
} from "@/lib/armazenamento/acesso";
import { criarRepositorioTarefasFs } from "@/lib/workflow/repositorio-fs";
import { criarRepositorioTarefasSupabase } from "@/lib/workflow/repositorio-supabase";
import type { RepositorioTarefas } from "@/lib/workflow/regras";
import type { EntradaTarefa, Tarefa } from "@/lib/workflow/tipos";

export { ErroWorkflow, LIMITE_TAREFAS } from "@/lib/workflow/regras";
export type { RepositorioTarefas } from "@/lib/workflow/regras";
export { resolverArquivoWorkflow, criarRepositorioTarefasFs } from "@/lib/workflow/repositorio-fs";
export { criarRepositorioTarefasSupabase } from "@/lib/workflow/repositorio-supabase";

async function repositorio(opcoes?: OpcoesArmazenamento): Promise<RepositorioTarefas> {
  if (opcoes?.acesso) return criarRepositorioTarefasSupabase(opcoes.acesso);
  if (backendDeArmazenamento() === "fs") return criarRepositorioTarefasFs();
  return criarRepositorioTarefasSupabase(await resolverAcessoSupabase(opcoes?.origem));
}

/** Lê as tarefas. Quadro vazio = []; dados corrompidos lançam ARQUIVO_INVALIDO. */
export async function lerTarefas(opcoes?: OpcoesArmazenamento): Promise<Tarefa[]> {
  return (await repositorio(opcoes)).ler();
}

/**
 * Cria (sem `id`) ou atualiza (com `id`) uma tarefa. Criar exige `titulo`.
 * Campos não enviados ficam como estão; `nota: null` limpa a nota.
 */
export async function salvarTarefa(
  entrada: EntradaTarefa,
  agora: Date = new Date(),
  opcoes?: OpcoesArmazenamento,
): Promise<Tarefa> {
  return (await repositorio(opcoes)).salvar(entrada, agora);
}
