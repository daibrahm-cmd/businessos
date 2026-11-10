// Monta o repositório de conversas do usuário logado (cliente com cookie + RLS). Usado pela rota e pelas actions.
import { criarClienteServidor } from "@/lib/supabase/server"
import type { RepositorioConversas } from "@/lib/conversas/repositorio"
import { criarRepositorioConversasSupabase } from "@/lib/conversas/repositorio-supabase"

export async function repositorioDoUsuario(userId: string): Promise<RepositorioConversas> {
  return criarRepositorioConversasSupabase({ cliente: await criarClienteServidor(), userId })
}
