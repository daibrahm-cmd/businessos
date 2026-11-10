// scripts/reindexar-conhecimento.ts
// Indexa na base de conhecimento (pgvector) todos os documentos do usuário. Seguro para repetir:
// só os trechos cuja hash mudou são embedados de novo.
// Uso: npm run conhecimento:reindexar -- --email=voce@exemplo.com
//  ou: BUSINESSOS_API_USER_ID=<uuid> npm run conhecimento:reindexar
// Precisa de GOOGLE_API_KEY, NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.
import path from "node:path";
import { pathToFileURL } from "node:url";
import { criarClienteEmbeddings, embeddingsConfigurado } from "@/lib/conhecimento/embeddings";
import { indexarDocumentoCom, type DependenciasIndexacao } from "@/lib/conhecimento/indexar";
import { DOC_IDS } from "@/lib/content/navigation";
import { SupabaseContentRepository, type ClienteDocumentos } from "@/lib/content/supabase-repository";

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function lerArgumentos(argv: string[]): { email?: string } {
  let email: string | undefined;
  for (const a of argv) {
    if (a.startsWith("--email=")) email = a.slice("--email=".length).trim().toLowerCase() || undefined;
    else throw new Error(`Argumento desconhecido: ${a}`);
  }
  return { email };
}

export interface RelatorioReindexacao {
  documentos: number;
  indexados: number;
  inalterados: number;
  removidos: number;
  erros: string[];
}

/** Indexa os 13 documentos do usuário. Falha em um documento não interrompe os demais. */
export async function reindexarTodos(dep: DependenciasIndexacao): Promise<RelatorioReindexacao> {
  const repo = new SupabaseContentRepository(dep.cliente as unknown as ClienteDocumentos, dep.userId);
  const rel: RelatorioReindexacao = { documentos: 0, indexados: 0, inalterados: 0, removidos: 0, erros: [] };
  for (const id of DOC_IDS) {
    try {
      const r = await indexarDocumentoCom(dep, await repo.get(id));
      rel.documentos += 1;
      rel.indexados += r.indexados;
      rel.inalterados += r.inalterados;
      rel.removidos += r.removidos;
    } catch (erro) {
      rel.erros.push(`${id}: ${erro instanceof Error ? erro.message : "erro desconhecido"}`);
    }
  }
  return rel;
}

async function main(): Promise<void> {
  const { email } = lerArgumentos(process.argv.slice(2));
  if (!embeddingsConfigurado()) throw new Error("Falta GOOGLE_API_KEY no .env.local.");

  const { criarClienteAdmin } = await import("@/lib/supabase/admin");
  const cliente = criarClienteAdmin();
  let userId = process.env.BUSINESSOS_API_USER_ID?.trim();
  if (email) {
    userId = undefined;
    for (let pagina = 1; pagina <= 50 && !userId; pagina += 1) {
      const { data, error } = await cliente.auth.admin.listUsers({ page: pagina, perPage: 200 });
      if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);
      userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id;
      if (data.users.length < 200) break;
    }
    if (!userId) throw new Error(`Nenhum usuário com o e-mail ${email}.`);
  }
  if (!userId || !RE_UUID.test(userId)) throw new Error("Informe --email=<admin> ou BUSINESSOS_API_USER_ID (uuid).");

  const rel = await reindexarTodos({ cliente, userId, embeddings: criarClienteEmbeddings() });
  process.stdout.write(
    `documentos=${rel.documentos} trechos indexados=${rel.indexados} inalterados=${rel.inalterados} removidos=${rel.removidos} erros=${rel.erros.length}\n`,
  );
  for (const e of rel.erros) process.stdout.write(`    - ${e}\n`);
  if (rel.erros.length > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((erro: unknown) => {
    console.error("Falha na reindexação:", erro instanceof Error ? erro.message : "erro desconhecido");
    process.exit(1);
  });
}
