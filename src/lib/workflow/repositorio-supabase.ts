// src/lib/workflow/repositorio-supabase.ts
// Backend Supabase: tabela public.tarefas (PK user_id + id text, dados jsonb, criado_em, atualizado_em).
// `dados` guarda o objeto de domínio inteiro (inclui o id).
import { lancarSeErro, type AcessoSupabase } from "@/lib/armazenamento/acesso";
import { randomUUID } from "node:crypto";
import { ErroWorkflow, idsParaDescartar, montarTarefa, type RepositorioTarefas } from "@/lib/workflow/regras";
import { tarefaSchema, type Tarefa } from "@/lib/workflow/tipos";

const TABELA = "tarefas";

type Linha = { id: string; dados: unknown };

/** Valida a saída: o id da linha manda sobre qualquer `id` dentro de `dados`. */
function paraDominio(linha: Linha): Tarefa {
  const base = typeof linha.dados === "object" && linha.dados !== null ? linha.dados : {};
  const r = tarefaSchema.safeParse({ ...base, id: linha.id });
  if (!r.success) throw new ErroWorkflow("ARQUIVO_INVALIDO", `Tarefa ${linha.id} fora do formato esperado no banco.`);
  return r.data;
}

export function criarRepositorioTarefasSupabase({ cliente, userId }: AcessoSupabase): RepositorioTarefas {
  /** Descarta as concluídas mais antigas quando passa do limite (lê só o necessário, sem validar tudo). */
  async function aparar(): Promise<void> {
    const { data, error } = await cliente.from(TABELA).select("id,dados").eq("user_id", userId);
    lancarSeErro(error, "contar tarefas");
    const resumo = ((data ?? []) as Array<{ id: string; dados: { status?: Tarefa["status"]; atualizado_em?: string } }>).map(
      (l) => ({ id: l.id, status: l.dados?.status ?? "fila", atualizado_em: l.dados?.atualizado_em ?? "" }),
    );
    const descartar = idsParaDescartar(resumo as Pick<Tarefa, "id" | "status" | "atualizado_em">[]);
    if (descartar.length === 0) return;
    const r = await cliente.from(TABELA).delete().eq("user_id", userId).in("id", descartar);
    lancarSeErro(r.error, "apagar tarefas antigas");
  }

  return {
    async ler() {
      const { data, error } = await cliente
        .from(TABELA)
        .select("id,dados")
        .eq("user_id", userId)
        .order("criado_em", { ascending: true })
        .order("id", { ascending: true });
      lancarSeErro(error, "listar tarefas");
      return ((data ?? []) as Linha[]).map(paraDominio);
    },

    async salvar(entrada, agora) {
      const iso = agora.toISOString();
      let existente: Tarefa | undefined;
      if (entrada.id) {
        const { data, error } = await cliente
          .from(TABELA)
          .select("id,dados")
          .eq("user_id", userId)
          .eq("id", entrada.id)
          .maybeSingle();
        lancarSeErro(error, "ler tarefa");
        if (data) existente = paraDominio(data as Linha);
      }
      const salva = montarTarefa(existente, entrada, iso, () => randomUUID().slice(0, 8));
      // Validação na entrada: o que vai para o banco precisa passar no schema.
      const valida = tarefaSchema.safeParse(salva);
      if (!valida.success) throw new ErroWorkflow("PAYLOAD_INVALIDO", "Tarefa fora do formato esperado.");
      const { error } = await cliente.from(TABELA).upsert(
        { user_id: userId, id: valida.data.id, dados: valida.data, criado_em: valida.data.criado_em, atualizado_em: iso },
        { onConflict: "user_id,id" },
      );
      lancarSeErro(error, "salvar tarefa");
      await aparar();
      return valida.data;
    },
  };
}
