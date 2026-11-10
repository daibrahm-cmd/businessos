// src/lib/workflow/repositorio-fs.ts
// Backend em arquivo JSON, com escrita atômica (arquivo temporário + rename) e fila em processo.
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ErroWorkflow, idsParaDescartar, montarTarefa, type RepositorioTarefas } from "@/lib/workflow/regras";
import { arquivoTarefasSchema, type Tarefa } from "@/lib/workflow/tipos";

/** Arquivo das tarefas: BUSINESSOS_WORKFLOW_FILE ou ./workflow/tarefas.json (sempre absoluto). */
export function resolverArquivoWorkflow(): string {
  // turbopackIgnore: caminho só conhecido em tempo de execução (ver fs-repository.ts).
  return path.resolve(
    /*turbopackIgnore: true*/ process.env.BUSINESSOS_WORKFLOW_FILE || path.join(process.cwd(), "workflow", "tarefas.json"),
  );
}

/** Lê as tarefas. Arquivo ausente = quadro vazio; arquivo corrompido lança ARQUIVO_INVALIDO. */
async function lerArquivo(): Promise<Tarefa[]> {
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

// Fila em processo: serializa leitura+gravação para dois POSTs simultâneos não se atropelarem.
let fila: Promise<unknown> = Promise.resolve();

export function criarRepositorioTarefasFs(): RepositorioTarefas {
  return {
    ler: lerArquivo,
    salvar(entrada, agora) {
      const execucao = fila.then(async () => {
        const tarefas = await lerArquivo();
        const existente = entrada.id ? tarefas.find((t) => t.id === entrada.id) : undefined;
        const salva = montarTarefa(existente, entrada, agora.toISOString(), () => randomUUID().slice(0, 8));
        if (existente) tarefas[tarefas.indexOf(existente)] = salva;
        else tarefas.push(salva);
        const descartar = new Set(idsParaDescartar(tarefas));
        await gravar(tarefas.filter((t) => !descartar.has(t.id)));
        return salva;
      });
      fila = execucao.catch(() => undefined); // um erro não trava a fila
      return execucao;
    },
  };
}
