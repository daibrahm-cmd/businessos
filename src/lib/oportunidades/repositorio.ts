// src/lib/oportunidades/repositorio.ts
// API pública das oportunidades. Escolhe o backend por BUSINESSOS_STORAGE (padrão: supabase; "fs" = JSON local).
// Regras de negócio em regras.ts; persistência em repositorio-fs.ts e repositorio-supabase.ts.
import {
  backendDeArmazenamento,
  resolverAcessoSupabase,
  type OpcoesArmazenamento,
} from "@/lib/armazenamento/acesso";
import { criarRepositorioOportunidadesFs } from "@/lib/oportunidades/repositorio-fs";
import { criarRepositorioOportunidadesSupabase } from "@/lib/oportunidades/repositorio-supabase";
import type { RepositorioOportunidades } from "@/lib/oportunidades/regras";
import type { EntradaOportunidade, Oportunidade } from "@/lib/oportunidades/tipos";

export { ErroOportunidades } from "@/lib/oportunidades/regras";
export type { RepositorioOportunidades } from "@/lib/oportunidades/regras";
export { resolverArquivoOportunidades } from "@/lib/oportunidades/repositorio-fs";
export { criarRepositorioOportunidadesFs } from "@/lib/oportunidades/repositorio-fs";
export { criarRepositorioOportunidadesSupabase } from "@/lib/oportunidades/repositorio-supabase";

async function repositorio(opcoes?: OpcoesArmazenamento): Promise<RepositorioOportunidades> {
  if (opcoes?.acesso) return criarRepositorioOportunidadesSupabase(opcoes.acesso);
  if (backendDeArmazenamento() === "fs") return criarRepositorioOportunidadesFs();
  return criarRepositorioOportunidadesSupabase(await resolverAcessoSupabase(opcoes?.origem));
}

/** Lê as oportunidades. Funil vazio = []; dados corrompidos lançam ARQUIVO_INVALIDO. */
export async function lerOportunidades(opcoes?: OpcoesArmazenamento): Promise<Oportunidade[]> {
  return (await repositorio(opcoes)).ler();
}

/** Cria (sem `id`) ou atualiza (com `id`). Criar exige `lead` e `titulo`. */
export async function salvarOportunidade(
  entrada: EntradaOportunidade,
  agora: Date = new Date(),
  opcoes?: OpcoesArmazenamento,
): Promise<Oportunidade> {
  return (await repositorio(opcoes)).salvar(entrada, agora);
}

/** Remove uma oportunidade; id inexistente lança NAO_ENCONTRADO. */
export async function removerOportunidade(id: string, opcoes?: OpcoesArmazenamento): Promise<void> {
  return (await repositorio(opcoes)).remover(id);
}
