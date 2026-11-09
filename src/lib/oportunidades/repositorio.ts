// src/lib/oportunidades/repositorio.ts
// Persistência em um único arquivo JSON, com escrita atômica (temporário + rename) e fila em processo.
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  arquivoOportunidadesSchema,
  type EntradaOportunidade,
  type Oportunidade,
} from "@/lib/oportunidades/tipos";

/** Arquivo: BUSINESSOS_OPORTUNIDADES_FILE ou ./oportunidades/oportunidades.json (sempre absoluto). */
export function resolverArquivoOportunidades(): string {
  // turbopackIgnore: caminho só conhecido em tempo de execução (ver workflow/repositorio.ts).
  return path.resolve(
    /*turbopackIgnore: true*/ process.env.BUSINESSOS_OPORTUNIDADES_FILE ||
      path.join(process.cwd(), "oportunidades", "oportunidades.json"),
  );
}

export class ErroOportunidades extends Error {
  constructor(
    readonly codigo: "NAO_ENCONTRADO" | "PAYLOAD_INVALIDO" | "ARQUIVO_INVALIDO",
    mensagem: string,
  ) {
    super(mensagem);
  }
}

/** Lê as oportunidades. Arquivo ausente = funil vazio; corrompido lança ARQUIVO_INVALIDO. */
export async function lerOportunidades(): Promise<Oportunidade[]> {
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

/** Texto vazio e `null` viram "ausente"; `undefined` mantém o valor atual. */
function aplicar<T>(novo: T | null | undefined, atual: T | undefined): T | undefined {
  if (novo === null || novo === "") return undefined;
  return novo === undefined ? atual : novo;
}

/** Cria (sem `id`) ou atualiza (com `id`). Criar exige `lead` e `titulo`. */
export function salvarOportunidade(entrada: EntradaOportunidade, agora: Date = new Date()): Promise<Oportunidade> {
  return naFila(async () => {
    const lista = await lerOportunidades();
    const iso = agora.toISOString();
    const existente = entrada.id ? lista.find((o) => o.id === entrada.id) : undefined;

    let salva: Oportunidade;
    if (existente) {
      salva = {
        ...existente,
        lead: entrada.lead ?? existente.lead,
        titulo: entrada.titulo ?? existente.titulo,
        estagio: entrada.estagio ?? existente.estagio,
        empresa: aplicar(entrada.empresa, existente.empresa),
        valor: aplicar(entrada.valor, existente.valor),
        contato: aplicar(entrada.contato, existente.contato),
        proximo_passo: aplicar(entrada.proximo_passo, existente.proximo_passo),
        atualizado_em: iso,
      };
      lista[lista.indexOf(existente)] = salva;
    } else {
      if (entrada.id) throw new ErroOportunidades("NAO_ENCONTRADO", `Oportunidade não encontrada: ${entrada.id}.`);
      if (!entrada.lead || !entrada.titulo) {
        throw new ErroOportunidades("PAYLOAD_INVALIDO", 'Para criar envie "lead" e "titulo".');
      }
      salva = {
        id: randomUUID().slice(0, 8),
        lead: entrada.lead,
        titulo: entrada.titulo,
        estagio: entrada.estagio ?? "novo",
        empresa: aplicar(entrada.empresa, undefined),
        valor: aplicar(entrada.valor, undefined),
        contato: aplicar(entrada.contato, undefined),
        proximo_passo: aplicar(entrada.proximo_passo, undefined),
        criado_em: iso,
        atualizado_em: iso,
      };
      lista.push(salva);
    }
    await gravar(lista);
    return salva;
  });
}

/** Remove uma oportunidade; id inexistente lança NAO_ENCONTRADO. */
export function removerOportunidade(id: string): Promise<void> {
  return naFila(async () => {
    const lista = await lerOportunidades();
    const restantes = lista.filter((o) => o.id !== id);
    if (restantes.length === lista.length) {
      throw new ErroOportunidades("NAO_ENCONTRADO", `Oportunidade não encontrada: ${id}.`);
    }
    await gravar(restantes);
  });
}
