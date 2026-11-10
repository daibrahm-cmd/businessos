// src/lib/supabase/admin.ts
// Cliente com a chave de serviço: IGNORA o RLS. Use apenas em scripts e no servidor
// (ex.: API de agentes, migração, criação do admin). Nunca importe em código de navegador.
import { createClient } from "@supabase/supabase-js";
import { chaveServico, urlSupabase } from "@/lib/supabase/env";

export function criarClienteAdmin() {
  return createClient(urlSupabase(), chaveServico(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
