// scripts/migrar-conteudo.ts
// Migra content/**/*.md, oportunidades/oportunidades.json e workflow/tarefas.json para o Supabase.
// SEGURO por padrão: sem --aplicar só lê, valida e imprime as contagens (nenhuma rede).
// Uso: npm run db:migrar-conteudo -- --email=voce@exemplo.com [--aplicar]
//  ou: BUSINESSOS_API_USER_ID=<uuid> npm run db:migrar-conteudo -- --aplicar
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ehIdValido } from "@/lib/content/navigation";
import { obterDefinicao } from "@/lib/content/schemas";
import { desserializar } from "@/lib/content/serializacao";
import { oportunidadeSchema } from "@/lib/oportunidades/tipos";
import { tarefaSchema } from "@/lib/workflow/tipos";

export type Tabela = "documentos" | "oportunidades" | "tarefas";
export type Linha = Record<string, unknown>;

export interface RelatorioTabela {
  lidos: number;
  gravados: number;
  pulados: number;
  erros: string[];
}
export type Relatorio = Record<Tabela, RelatorioTabela>;

export interface Preparado {
  linhas: Linha[];
  relatorio: RelatorioTabela;
}

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Usuário fictício usado só na simulação (--dry-run), onde não há rede. */
export const USUARIO_SIMULADO = "00000000-0000-0000-0000-000000000000";

const novoRelatorio = (): RelatorioTabela => ({ lidos: 0, gravados: 0, pulados: 0, erros: [] });

/** UUID v5 (SHA-1) determinístico: a mesma entrada sempre gera o mesmo id. */
export function uuidEstavel(userId: string, idOriginal: string): string {
  const hash = createHash("sha1").update(`businessos:${userId}:${idOriginal}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const h = hash.subarray(0, 16).toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/** Id da oportunidade no banco: mantém o do JSON se já for uuid; senão deriva de forma estável. */
export function idOportunidadeNoBanco(userId: string, idJson: string): string {
  return RE_UUID.test(idJson) ? idJson.toLowerCase() : uuidEstavel(userId, idJson);
}

function mensagemErro(erro: unknown): string {
  if (typeof erro === "object" && erro !== null && "detalhes" in erro && Array.isArray(erro.detalhes) && erro.detalhes.length) {
    return (erro.detalhes as Array<{ caminho?: string; mensagem?: string }>)
      .slice(0, 3)
      .map((d) => `${d.caminho ? `${d.caminho}: ` : ""}${d.mensagem ?? ""}`)
      .join("; ");
  }
  return erro instanceof Error ? erro.message : String(erro);
}

async function lerSeExistir(arquivo: string): Promise<string | undefined> {
  try {
    return await fs.readFile(arquivo, "utf8");
  } catch (erro) {
    if (typeof erro === "object" && erro !== null && "code" in erro && erro.code === "ENOENT") return undefined;
    throw erro;
  }
}

/** Lista os .md de content/<secao>/ ignorando pastas ocultas (.omc etc.) e não-.md. Devolve ids "secao/pagina". */
export async function listarArquivosMd(raiz: string): Promise<string[]> {
  const ids: string[] = [];
  let secoes;
  try {
    secoes = await fs.readdir(raiz, { withFileTypes: true });
  } catch {
    return ids;
  }
  for (const s of secoes) {
    if (!s.isDirectory() || s.name.startsWith(".")) continue;
    for (const a of await fs.readdir(path.join(raiz, s.name), { withFileTypes: true })) {
      if (a.isFile() && !a.name.startsWith(".") && a.name.endsWith(".md")) ids.push(`${s.name}/${a.name.slice(0, -3)}`);
    }
  }
  return ids.sort();
}

/** Markdown → linhas de `documentos` (reusa desserializar, que valida com o schema da página). */
export async function prepararDocumentos(raiz: string, userId: string): Promise<Preparado> {
  const relatorio = novoRelatorio();
  const linhas: Linha[] = [];
  for (const id of await listarArquivosMd(raiz)) {
    relatorio.lidos += 1;
    if (!ehIdValido(id)) {
      relatorio.pulados += 1;
      relatorio.erros.push(`${id}.md: página fora da navegação (ignorada).`);
      continue;
    }
    try {
      const texto = await fs.readFile(path.join(raiz, `${id}.md`), "utf8");
      const doc = desserializar(texto, obterDefinicao(id));
      linhas.push({
        user_id: userId,
        id: doc.id,
        secao: doc.secao,
        pagina: doc.pagina,
        status: doc.status,
        atualizado_em: doc.atualizado_em,
        atualizado_por: doc.atualizado_por,
        tags: doc.tags,
        relacionados: doc.relacionados,
        campos: doc.campos,
        itens: doc.itens,
        corpo: doc.corpo,
        extras: doc.extras,
      });
    } catch (erro) {
      relatorio.pulados += 1;
      relatorio.erros.push(`${id}.md: ${mensagemErro(erro)}`);
    }
  }
  return { linhas, relatorio };
}

/** Lê o JSON de um arquivo opcional. Ausente = undefined. JSON quebrado = erro no relatório. */
async function lerJson(arquivo: string, chave: string, relatorio: RelatorioTabela): Promise<unknown[] | undefined> {
  const texto = await lerSeExistir(arquivo);
  if (texto === undefined) return undefined;
  try {
    const dados: unknown = JSON.parse(texto);
    const lista = typeof dados === "object" && dados !== null ? (dados as Record<string, unknown>)[chave] : undefined;
    if (Array.isArray(lista)) return lista;
    relatorio.erros.push(`${path.basename(arquivo)}: esperado { "${chave}": [...] }.`);
  } catch {
    relatorio.erros.push(`${path.basename(arquivo)}: JSON inválido.`);
  }
  return [];
}

export async function prepararOportunidades(arquivo: string, userId: string): Promise<Preparado> {
  const relatorio = novoRelatorio();
  const linhas: Linha[] = [];
  const itens = (await lerJson(arquivo, "oportunidades", relatorio)) ?? [];
  const vistos = new Set<string>();
  for (const bruto of itens) {
    relatorio.lidos += 1;
    const r = oportunidadeSchema.safeParse(bruto);
    if (!r.success) {
      relatorio.pulados += 1;
      relatorio.erros.push(`oportunidade ${(bruto as { id?: unknown })?.id ?? "?"}: ${r.error.issues[0]?.message ?? "inválida"}`);
      continue;
    }
    const id = idOportunidadeNoBanco(userId, r.data.id);
    if (vistos.has(id)) {
      relatorio.pulados += 1;
      relatorio.erros.push(`oportunidade ${r.data.id}: id repetido no arquivo.`);
      continue;
    }
    vistos.add(id);
    // dados mantém o id original do JSON, para o app reconhecer a oportunidade.
    linhas.push({ id, user_id: userId, dados: r.data, criado_em: r.data.criado_em, atualizado_em: r.data.atualizado_em });
  }
  return { linhas, relatorio };
}

export async function prepararTarefas(arquivo: string, userId: string): Promise<Preparado> {
  const relatorio = novoRelatorio();
  const linhas: Linha[] = [];
  const itens = (await lerJson(arquivo, "tarefas", relatorio)) ?? [];
  const vistos = new Set<string>();
  for (const bruto of itens) {
    relatorio.lidos += 1;
    const r = tarefaSchema.safeParse(bruto);
    if (!r.success) {
      relatorio.pulados += 1;
      relatorio.erros.push(`tarefa ${(bruto as { id?: unknown })?.id ?? "?"}: ${r.error.issues[0]?.message ?? "inválida"}`);
      continue;
    }
    if (vistos.has(r.data.id)) {
      relatorio.pulados += 1;
      relatorio.erros.push(`tarefa ${r.data.id}: id repetido no arquivo.`);
      continue;
    }
    vistos.add(r.data.id);
    linhas.push({ user_id: userId, id: r.data.id, dados: r.data, criado_em: r.data.criado_em, atualizado_em: r.data.atualizado_em });
  }
  return { linhas, relatorio };
}

/** Destino das gravações (trocável por um cliente falso nos testes). */
export interface DestinoMigracao {
  upsert(tabela: Tabela, linhas: Linha[], conflito: string): Promise<{ erro?: string }>;
}

const CONFLITO: Record<Tabela, string> = {
  documentos: "user_id,id",
  oportunidades: "id",
  tarefas: "user_id,id",
};

/** Grava em lotes com upsert (idempotente: rodar duas vezes atualiza as mesmas linhas). */
export async function gravar(
  destino: DestinoMigracao,
  tabela: Tabela,
  preparado: Preparado,
  tamanhoLote = 100,
): Promise<RelatorioTabela> {
  const r: RelatorioTabela = { ...preparado.relatorio, erros: [...preparado.relatorio.erros] };
  for (let i = 0; i < preparado.linhas.length; i += tamanhoLote) {
    const lote = preparado.linhas.slice(i, i + tamanhoLote);
    const { erro } = await destino.upsert(tabela, lote, CONFLITO[tabela]);
    if (erro) {
      r.pulados += lote.length;
      r.erros.push(`${tabela}: falha ao gravar ${lote.length} linha(s): ${erro}`);
    } else {
      r.gravados += lote.length;
    }
  }
  return r;
}

export interface OpcoesMigracao {
  raizConteudo: string;
  arquivoOportunidades: string;
  arquivoTarefas: string;
  userId: string;
  /** Sem destino = simulação (dry-run): nada é gravado. */
  destino?: DestinoMigracao;
}

export async function migrar(o: OpcoesMigracao): Promise<Relatorio> {
  const preparados: Record<Tabela, Preparado> = {
    documentos: await prepararDocumentos(o.raizConteudo, o.userId),
    oportunidades: await prepararOportunidades(o.arquivoOportunidades, o.userId),
    tarefas: await prepararTarefas(o.arquivoTarefas, o.userId),
  };
  const saida = {} as Relatorio;
  for (const tabela of Object.keys(preparados) as Tabela[]) {
    saida[tabela] = o.destino ? await gravar(o.destino, tabela, preparados[tabela]) : preparados[tabela].relatorio;
  }
  return saida;
}

export interface ArgumentosCli {
  email?: string;
  aplicar: boolean;
}

export function lerArgumentos(argv: string[]): ArgumentosCli {
  let email: string | undefined;
  let aplicar = false;
  let simular = false;
  for (const a of argv) {
    if (a === "--aplicar") aplicar = true;
    else if (a === "--dry-run") simular = true;
    else if (a.startsWith("--email=")) email = a.slice("--email=".length).trim().toLowerCase() || undefined;
    else throw new Error(`Argumento desconhecido: ${a}`);
  }
  if (aplicar && simular) throw new Error("Use --aplicar ou --dry-run, não os dois.");
  return { email, aplicar };
}

function imprimir(relatorio: Relatorio, aplicado: boolean): void {
  const rotulo = aplicado ? "gravados" : "a gravar (simulação)";
  for (const tabela of Object.keys(relatorio) as Tabela[]) {
    const r = relatorio[tabela];
    const gravados = aplicado ? r.gravados : r.lidos - r.pulados;
    process.stdout.write(`${tabela.padEnd(14)} lidos=${r.lidos} ${rotulo}=${gravados} pulados=${r.pulados} erros=${r.erros.length}\n`);
    for (const e of r.erros) process.stdout.write(`    - ${e}\n`);
  }
}

async function main(): Promise<void> {
  const { email, aplicar } = lerArgumentos(process.argv.slice(2));
  const cwd = process.cwd();
  const base = {
    raizConteudo: path.resolve(process.env.BUSINESSOS_CONTENT_DIR || path.join(cwd, "content")),
    arquivoOportunidades: path.resolve(
      process.env.BUSINESSOS_OPORTUNIDADES_FILE || path.join(cwd, "oportunidades", "oportunidades.json"),
    ),
    arquivoTarefas: path.resolve(process.env.BUSINESSOS_WORKFLOW_FILE || path.join(cwd, "workflow", "tarefas.json")),
  };

  if (!aplicar) {
    process.stdout.write("SIMULAÇÃO (nada será gravado). Use --aplicar para gravar no Supabase.\n");
    imprimir(await migrar({ ...base, userId: USUARIO_SIMULADO }), false);
    return;
  }

  const { criarClienteAdmin } = await import("@/lib/supabase/admin");
  const supabase = criarClienteAdmin();
  let userId = process.env.BUSINESSOS_API_USER_ID?.trim();
  if (email) {
    userId = undefined;
    for (let pagina = 1; pagina <= 50 && !userId; pagina += 1) {
      const { data, error } = await supabase.auth.admin.listUsers({ page: pagina, perPage: 200 });
      if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 200) break;
    }
    if (!userId) throw new Error(`Nenhum usuário com o e-mail ${email}. Rode npm run admin:criar antes.`);
  }
  if (!userId || !RE_UUID.test(userId)) throw new Error("Informe --email=<admin> ou BUSINESSOS_API_USER_ID (uuid).");

  const destino: DestinoMigracao = {
    async upsert(tabela, linhas, conflito) {
      const { error } = await supabase.from(tabela).upsert(linhas, { onConflict: conflito });
      return error ? { erro: error.message } : {};
    },
  };
  const relatorio = await migrar({ ...base, userId, destino });
  imprimir(relatorio, true);
  if (Object.values(relatorio).some((r) => r.erros.length > 0)) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((erro: unknown) => {
    console.error("Falha na migração:", erro instanceof Error ? erro.message : "erro desconhecido");
    process.exit(1);
  });
}
