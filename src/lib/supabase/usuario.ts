// src/lib/supabase/usuario.ts
// Descobre QUEM está usando o sistema. É a única fonte do user_id para os repositórios.
import { criarClienteServidor } from "@/lib/supabase/server";

export class ErroNaoAutenticado extends Error {
  constructor() {
    super("Sessão ausente ou expirada. Faça login.");
  }
}

/** Id do usuário logado (valida o token no Auth, não confia só no cookie). Lança ErroNaoAutenticado. */
export async function usuarioAtualId(): Promise<string> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new ErroNaoAutenticado();
  return data.user.id;
}
