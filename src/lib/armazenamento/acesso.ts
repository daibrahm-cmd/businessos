// src/lib/armazenamento/acesso.ts
// Escolha do backend (fs ou Supabase) e resolução de cliente + dono dos dados.
// Compartilhado pelos repositórios de Oportunidades e Workflow.
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ClienteSupabase = SupabaseClient;

/** Cliente já pronto + dono dos dados. É o que os repositórios Supabase recebem (injeção p/ testes). */
export interface AcessoSupabase {
  cliente: ClienteSupabase;
  userId: string;
}

/**
 * "sessao": usuária logada (cookie + RLS), usado por páginas e Server Actions.
 * "api": rotas de API e agentes (Bearer), usa a chave de serviço e BUSINESSOS_API_USER_ID.
 */
export type OrigemAcesso = "sessao" | "api";

export interface OpcoesArmazenamento {
  origem?: OrigemAcesso;
  /** Se informado, força o backend Supabase com este cliente/usuário (testes e scripts). */
  acesso?: AcessoSupabase;
}

/** BUSINESSOS_STORAGE=fs | supabase. Padrão: supabase. */
export function backendDeArmazenamento(): "fs" | "supabase" {
  const v = (process.env.BUSINESSOS_STORAGE?.trim() || "supabase").toLowerCase();
  if (v === "fs" || v === "supabase") return v;
  throw new Error(`BUSINESSOS_STORAGE inválido: "${v}". Use "fs" ou "supabase".`);
}

/** Resolve cliente e userId de produção. Imports dinâmicos: o modo fs não carrega next/headers. */
export async function resolverAcessoSupabase(origem: OrigemAcesso = "sessao"): Promise<AcessoSupabase> {
  if (origem === "api") {
    const userId = process.env.BUSINESSOS_API_USER_ID?.trim();
    if (!userId) throw new Error("Falta BUSINESSOS_API_USER_ID (dono dos dados gravados pela API/agentes).");
    const { criarClienteAdmin } = await import("@/lib/supabase/admin");
    return { cliente: criarClienteAdmin(), userId };
  }
  const [{ usuarioAtualId }, { criarClienteServidor }] = await Promise.all([
    import("@/lib/supabase/usuario"),
    import("@/lib/supabase/server"),
  ]);
  const userId = await usuarioAtualId();
  return { cliente: await criarClienteServidor(), userId };
}

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ehUuid = (v: string): boolean => RE_UUID.test(v);
export const novoUuid = (): string => randomUUID();

/** Converte o erro do PostgREST em Error comum, com contexto. */
export function lancarSeErro(erro: { message: string } | null, contexto: string): void {
  if (erro) throw new Error(`Supabase (${contexto}): ${erro.message}`);
}
