// src/lib/oportunidades/repositorio-supabase.ts
// Backend Supabase: tabela public.oportunidades (id uuid, user_id, dados jsonb, criado_em, atualizado_em).
// O id de domínio é o id da linha (uuid); `dados` guarda o objeto de domínio inteiro.
import {
  ehUuid,
  lancarSeErro,
  novoUuid,
  type AcessoSupabase,
} from "@/lib/armazenamento/acesso";
import {
  ErroOportunidades,
  montarOportunidade,
  type RepositorioOportunidades,
} from "@/lib/oportunidades/regras";
import { oportunidadeSchema, type Oportunidade } from "@/lib/oportunidades/tipos";

const TABELA = "oportunidades";

type Linha = { id: string; dados: unknown };

/** Valida a saída: o id da linha manda sobre qualquer `id` dentro de `dados`. */
function paraDominio(linha: Linha): Oportunidade {
  const base = typeof linha.dados === "object" && linha.dados !== null ? linha.dados : {};
  const r = oportunidadeSchema.safeParse({ ...base, id: linha.id });
  if (!r.success) {
    throw new ErroOportunidades("ARQUIVO_INVALIDO", `Oportunidade ${linha.id} fora do formato esperado no banco.`);
  }
  return r.data;
}

export function criarRepositorioOportunidadesSupabase({ cliente, userId }: AcessoSupabase): RepositorioOportunidades {
  async function buscar(id: string): Promise<Oportunidade | undefined> {
    if (!ehUuid(id)) return undefined; // ids que não são uuid nunca existem na tabela
    const { data, error } = await cliente
      .from(TABELA)
      .select("id,dados")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    lancarSeErro(error, "ler oportunidade");
    return data ? paraDominio(data as Linha) : undefined;
  }

  return {
    async ler() {
      const { data, error } = await cliente
        .from(TABELA)
        .select("id,dados")
        .eq("user_id", userId)
        .order("criado_em", { ascending: true })
        .order("id", { ascending: true });
      lancarSeErro(error, "listar oportunidades");
      return ((data ?? []) as Linha[]).map(paraDominio);
    },

    async salvar(entrada, agora) {
      const iso = agora.toISOString();
      const existente = entrada.id ? await buscar(entrada.id) : undefined;
      const salva = montarOportunidade(existente, entrada, iso, novoUuid);
      // Validação na entrada: o que vai para o banco precisa passar no schema.
      const valida = oportunidadeSchema.safeParse(salva);
      if (!valida.success) {
        throw new ErroOportunidades("PAYLOAD_INVALIDO", "Oportunidade fora do formato esperado.");
      }
      if (existente) {
        const { error } = await cliente
          .from(TABELA)
          .update({ dados: valida.data, atualizado_em: iso })
          .eq("user_id", userId)
          .eq("id", salva.id);
        lancarSeErro(error, "atualizar oportunidade");
      } else {
        const { error } = await cliente
          .from(TABELA)
          .insert({ id: salva.id, user_id: userId, dados: valida.data, criado_em: iso, atualizado_em: iso });
        lancarSeErro(error, "criar oportunidade");
      }
      return valida.data;
    },

    async remover(id) {
      const naoEncontrada = new ErroOportunidades("NAO_ENCONTRADO", `Oportunidade não encontrada: ${id}.`);
      if (!ehUuid(id)) throw naoEncontrada;
      const { data, error } = await cliente.from(TABELA).delete().eq("user_id", userId).eq("id", id).select("id");
      lancarSeErro(error, "remover oportunidade");
      if (!data || data.length === 0) throw naoEncontrada;
    },
  };
}
