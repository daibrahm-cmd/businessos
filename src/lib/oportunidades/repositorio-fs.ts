// src/lib/oportunidades/repositorio-fs.ts
// Backend em arquivo JSON, com escrita atômica (temporário + rename) e fila em processo.
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  ErroOportunidades,
  montarOportunidade,
  type RepositorioOportunidades,
} from "@/lib/oportunidades/regras";
import { arquivoOportunidadesSchema, type Oportunidade } from "@/lib/oportunidades/tipos";

/** Arquivo: BUSINESSOS_OPORTUNIDADES_FILE ou ./oportunidades/oportunidades.json (sempre absoluto). */
export function resolverArquivoOportunidades(): string {
  // turbopackIgnore: caminho só conhecido em tempo de execução (ver workflow/repositorio.ts).
  return path.resolve(
    /*turbopackIgnore: true*/ process.env.BUSINESSOS_OPORTUNIDADES_FILE ||
      path.join(process.cwd(), "oportunidades", "oportunidades.json"),
  );
}

/** Lê as oportunidades. Arquivo ausente = funil vazio; corrompido lança ARQUIVO_INVALIDO. */
async function lerArquivo(): Promise<Oportunidade[]> {
  let texto: string;
  try {
    texto = await fs.readFile(resolverArquivoOportunidades(), "utf8");
  } catch (erro) {
    if (typeof erro === "object" && erro !== null && "code" in erro && erro.code === "ENOENT") return [];
    throw erro;
  }
  let dados: unknown;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new ErroOportunidades("ARQUIVO_INVALIDO", "oportunidades/oportunidades.json não é um JSON válido.");
  }
  const r = arquivoOportunidadesSchema.safeParse(dados);
  if (!r.success) {
    throw new ErroOportunidades("ARQUIVO_INVALIDO", "oportunidades/oportunidades.json fora do formato esperado.");
  }
  return r.data.oportunidades;
}

async function gravar(oportunidades: Oportunidade[]): Promise<void> {
  const alvo = resolverArquivoOportunidades();
  await fs.mkdir(path.dirname(alvo), { recursive: true });
  const temporario = `${alvo}.${randomUUID()}.tmp`;
  await fs.writeFile(temporario, JSON.stringify({ oportunidades }, null, 2) + "\n", "utf8");
  await fs.rename(temporario, alvo);
}

// Serializa leitura+gravação para duas chamadas simultâneas não se atropelarem.
let fila: Promise<unknown> = Promise.resolve();
function naFila<T>(trabalho: () => Promise<T>): Promise<T> {
  const execucao = fila.then(trabalho);
  fila = execucao.catch(() => undefined); // um erro não trava a fila
  return execucao;
}

export function criarRepositorioOportunidadesFs(): RepositorioOportunidades {
  return {
    ler: lerArquivo,
    salvar: (entrada, agora) =>
      naFila(async () => {
        const lista = await lerArquivo();
        const existente = entrada.id ? lista.find((o) => o.id === entrada.id) : undefined;
        const salva = montarOportunidade(existente, entrada, agora.toISOString(), () => randomUUID().slice(0, 8));
        if (existente) lista[lista.indexOf(existente)] = salva;
        else lista.push(salva);
        await gravar(lista);
        return salva;
      }),
    remover: (id) =>
      naFila(async () => {
        const lista = await lerArquivo();
        const restantes = lista.filter((o) => o.id !== id);
        if (restantes.length === lista.length) {
          throw new ErroOportunidades("NAO_ENCONTRADO", `Oportunidade não encontrada: ${id}.`);
        }
        await gravar(restantes);
      }),
  };
}
