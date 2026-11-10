// src/lib/supabase/env.ts
// Leitura centralizada das variáveis do Supabase. Falha cedo, com mensagem clara, se faltar algo.

export function urlSupabase(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!v) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL no .env.local.");
  return v;
}

/** Chave pública (publishable). Segura para o navegador; as regras de acesso vêm do RLS. */
export function chavePublica(): string {
  const v = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!v) throw new Error("Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env.local.");
  return v;
}

/** Chave secreta (service_role). SÓ no servidor; ignora RLS. Nunca use prefixo NEXT_PUBLIC_. */
export function chaveServico(): string {
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!v) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY no .env.local (somente servidor).");
  return v;
}
