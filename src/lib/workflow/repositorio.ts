// src/lib/workflow/repositorio.ts
// Persistência das tarefas em um único arquivo JSON, com escrita atômica (arquivo temporário + rename).
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { arquivoTarefasSchema, type EntradaTarefa, type Tarefa } from "@/lib/workflow/tipos";

/** Mantém no máximo N tarefas; ao passar disso, descarta as concluídas mais antigas. */
export const LIMITE_TAREFAS = 200;

/** Arquivo das tarefas: BUSINESSOS_WORKFLOW_FILE ou ./workflow/tarefas.json (sempre absoluto). */
export function resolverArquivoWorkflow(): string {
  // turbopackIgnore: caminho só conhecido em tempo de execução (ver fs-repository.ts).
  return path.resolve(
    /*turbopackIgnore: true*/ process.env.BUSINESSOS_WORKFLOW_FILE || path.join(process.cwd(), "workflow", "tarefas.json"),
  );
}

export class ErroWorkflow extends Error {
  constructor(
    readonly codigo: "NAO_ENCONTRADO" | "PAYLOAD_INVALIDO" | "ARQUIVO_INVALIDO",
    mensagem: string,
  ) {
    super(mensagem);
  }
}

/** Lê as tarefas. Arquivo ausente = quadro vazio; arquivo corrompido lança ARQUIVO_INVALIDO. */
export async function lerTarefas(): Promise<Tarefa[]> {
  let texto: string;
  try {
    texto = await fs.readFile(resolverArquivoWorkflow(), "utf8");
  } catch (erro) {
    if (typeof erro === "object" && erro !== null && "code" in erro && erro.code === "ENOENT") return [];
    throw erro;
  }
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new ErroWorkflow("ARQUIVO_INVALIDO", "workflow/tarefas.json não é um JSON válido.");
  }
  const r = arquivoTarefasSchema.safeParse(dados);
  if (!r.success) throw new ErroWorkflow("ARQUIVO_INVALIDO", "workflow/tarefas.json fora do formato esperado.");
  return r.data.tarefas;
}

async function gravar(tarefas: Tarefa[]): Promise<void> {
  const alvo = resolverArquivoWorkflow();
  await fs.mkdir(path.dirname(alvo), { recursive: true });
  const temporario = `${alvo}.${randomUUID()}.tmp`;
  await fs.writeFile(temporario, JSON.stringify({ tarefas }, null, 2) + "\n", "utf8");
  await fs.rename(temporario, alvo);
}

/** Descarta as concluídas mais antigas quando passa do limite. */
function aparar(tarefas: Tarefa[]): Tarefa[] {
  const excesso = tarefas.length - LIMITE_TAREFAS;
  if (excesso <= 0) return tarefas;
  const antigas = tarefas
    .filter((t) => t.status === "concluida")
    .sort((a, b) => a.atualizado_em.localeCompare(b.atualizado_em))
    .slice(0, excesso)
    .map((t) => t.id);
  const remover = new Set(antigas);
  return tarefas.filter((t) => !remover.has(t.id));
}

// Fila em processo: serializa leitura+gravação para dois POSTs simultâneos não se atropelarem.
let fila: Promise<unknown> = Promise.resolve();

/**
 * Cria (sem `id`) ou atualiza (com `id`) uma tarefa. Criar exige `titulo`.
 * Campos não enviados ficam como estão; `nota: null` limpa a nota.
 */
export function salvarTarefa(entrada: EntradaTarefa, agora: Date = new Date()): Promise<Tarefa> {
  const execucao = fila.then(async () => {
    const tarefas = await lerTarefas();
    const iso = agora.toISOString();
    const existente = entrada.id ? tarefas.find((t) => t.id === entrada.id) : undefined;

    if (entrada.id && !existente && !entrada.titulo) {
      throw new ErroWorkflow("NAO_ENCONTRADO", `Tarefa não encontrada: ${entrada.id}. Para criar, envie "titulo".`);
    }

    let salva: Tarefa;
    if (existente) {
      salva = {
        ...existente,
        agente: entrada.agente,
        titulo: entrada.titulo ?? existente.titulo,
        status: entrada.status ?? existente.status,
        docs: entrada.docs ?? existente.docs,
        nota: entrada.nota === null ? undefined : (entrada.nota ?? existente.nota),
        atualizado_em: iso,
      };
      tarefas[tarefas.indexOf(existente)] = salva;
    } else {
      if (!entrada.titulo) throw new ErroWorkflow("PAYLOAD_INVALIDO", 'Para criar uma tarefa envie "titulo".');
      salva = {
        id: entrada.id ?? randomUUID().slice(0, 8),
        agente: entrada.agente,
        titulo: entrada.titulo,
        status: entrada.status ?? "fila",
        docs: entrada.docs ?? [],
        nota: entrada.nota ?? undefined,
        criado_em: iso,
        atualizado_em: iso,
      };
      tarefas.push(salva);
    }
    await gravar(aparar(tarefas));
    return salva;
  });
  fila = execucao.catch(() => undefined); // um erro não trava a fila
  return execucao;
}
