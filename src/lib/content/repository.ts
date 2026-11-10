// src/lib/content/repository.ts
// Contrato de acesso ao conteúdo. A UI e a API só conhecem esta interface.
import { AsyncLocalStorage } from "node:async_hooks";
import { ErroConteudo } from "@/lib/content/errors";
import { FileSystemContentRepository, resolverRaizConteudo } from "@/lib/content/fs-repository";
import { SupabaseContentRepository, type ClienteDocumentos } from "@/lib/content/supabase-repository";
import type { ContentDoc, DocId } from "@/lib/content/types";

export interface ContentRepository {
  /** Todos os documentos da navegação, na ordem da navegação (13). Ausentes vêm do template. */
  list(): Promise<ContentDoc[]>;
  /** Um documento. Id fora da navegação → ErroConteudo NAO_ENCONTRADO. Arquivo ausente → template. */
  get(id: DocId): Promise<ContentDoc>;
  /**
   * Grava o documento COMO RECEBIDO (sem merge; quem faz merge é o serviço).
   * Valida com o schema da página antes de gravar. Retorna o documento normalizado gravado.
   */
  save(doc: ContentDoc): Promise<ContentDoc>;
}

/**
 * Quem está pedindo o repositório:
 * - "sessao": UI e Server Actions; o usuário vem da sessão (cookies) e o RLS vale.
 * - "api": rotas /api/context (agentes com Bearer); usa a chave de serviço e BUSINESSOS_API_USER_ID.
 */
export type ContextoRepositorio = "sessao" | "api";

const contextoAtual = new AsyncLocalStorage<ContextoRepositorio>();

/** Executa `fn` com o contexto "api": todo getContentRepository() dentro dela usa o usuário dos agentes. */
export function comContextoApi<T>(fn: () => Promise<T>): Promise<T> {
  return contextoAtual.run("api", fn);
}

/** Contexto em vigor nesta chamada ("sessao" se ninguém usou comContextoApi). */
export function contextoDoRepositorio(): ContextoRepositorio {
  return contextoAtual.getStore() ?? "sessao";
}

/** Usuário dono dos dados da API de agentes. Erro claro se não configurado. */
export function usuarioDaApi(): string {
  const id = process.env.BUSINESSOS_API_USER_ID?.trim();
  if (!id) {
    throw new ErroConteudo(
      "ERRO_INTERNO",
      "Falta BUSINESSOS_API_USER_ID no servidor: defina o id (uuid) do usuário dono do conteúdo da API de agentes.",
    );
  }
  return id;
}

/** Resolve cliente + usuário na hora da chamada (a fábrica é síncrona, o userId não). */
async function resolverSupabase(contexto: ContextoRepositorio): Promise<SupabaseContentRepository> {
  // Imports dinâmicos: o modo fs não carrega next/headers nem o supabase-js.
  if (contexto === "api") {
    const userId = usuarioDaApi();
    const { criarClienteAdmin } = await import("@/lib/supabase/admin");
    return new SupabaseContentRepository(criarClienteAdmin() as unknown as ClienteDocumentos, userId);
  }
  const { usuarioAtualId, ErroNaoAutenticado } = await import("@/lib/supabase/usuario");
  const { criarClienteServidor } = await import("@/lib/supabase/server");
  let userId: string;
  try {
    userId = await usuarioAtualId();
  } catch (erro) {
    if (erro instanceof ErroNaoAutenticado) throw new ErroConteudo("NAO_AUTORIZADO", erro.message);
    throw erro;
  }
  const cliente = await criarClienteServidor();
  return new SupabaseContentRepository(cliente as unknown as ClienteDocumentos, userId);
}

/** Repositório que só descobre o usuário quando um método é chamado. */
function criarRepositorioPreguicoso(contexto: ContextoRepositorio): ContentRepository {
  return {
    list: async () => (await resolverSupabase(contexto)).list(),
    get: async (id) => (await resolverSupabase(contexto)).get(id),
    save: async (doc) => (await resolverSupabase(contexto)).save(doc),
  };
}

// Singleton por pasta de conteúdo (modo fs): se BUSINESSOS_CONTENT_DIR mudar (testes), uma nova instância é criada.
let instancia: { raiz: string; repo: ContentRepository } | undefined;

/**
 * Ponto único de troca de armazenamento (BUSINESSOS_STORAGE=supabase | fs). Padrão: supabase.
 * `contexto` é opcional; sem ele vale o de comContextoApi() ou "sessao".
 */
export function getContentRepository(opcoes: { contexto?: ContextoRepositorio } = {}): ContentRepository {
  const armazenamento = (process.env.BUSINESSOS_STORAGE?.trim() || "supabase").toLowerCase();
  if (armazenamento === "supabase") {
    return criarRepositorioPreguicoso(opcoes.contexto ?? contextoAtual.getStore() ?? "sessao");
  }
  if (armazenamento !== "fs") {
    throw new ErroConteudo("ERRO_INTERNO", `Armazenamento desconhecido: ${armazenamento}.`);
  }
  const raiz = resolverRaizConteudo();
  if (!instancia || instancia.raiz !== raiz) {
    instancia = { raiz, repo: new FileSystemContentRepository({ raiz }) };
  }
  return instancia.repo;
}
