// src/lib/supabase/perfil.ts
// Usuário logado + perfil (papel). Uma consulta por requisição (cache do React).
import { cache } from "react";
import { criarClienteServidor } from "@/lib/supabase/server";

export type Papel = "admin" | "usuario";

export interface PerfilAtual {
  id: string;
  email: string;
  nome: string;
  papel: Papel;
}

/**
 * Devolve o usuário autenticado com o papel, ou null se não houver sessão.
 * Se a tabela `perfis` ainda não tiver a linha (ou falhar a leitura), cai para papel "usuario":
 * estar logado basta para entrar; só o papel admin depende do perfil.
 */
export const perfilAtual = cache(async (): Promise<PerfilAtual | null> => {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = data.user;

  const { data: perfil } = await supabase.from("perfis").select("nome, papel").eq("id", user.id).maybeSingle();

  const email = user.email ?? "";
  const nomeMeta = typeof user.user_metadata?.nome === "string" ? user.user_metadata.nome : "";
  return {
    id: user.id,
    email,
    nome: (perfil?.nome as string | undefined)?.trim() || nomeMeta.trim() || email.split("@")[0] || "Usuário",
    papel: perfil?.papel === "admin" ? "admin" : "usuario",
  };
});
