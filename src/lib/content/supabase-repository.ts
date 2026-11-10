// src/lib/content/supabase-repository.ts
// Repositório em banco: uma linha por (user_id, id) em public.documentos. Título, descrição e estágio
// NÃO são colunas: vêm da navegação/schemas, como no repositório em arquivos.
import { ErroConteudo } from "@/lib/content/errors";
import { DOC_IDS, ehIdValido } from "@/lib/content/navigation";
import { obterDefinicao } from "@/lib/content/schemas";
import { criarTemplate } from "@/lib/content/schemas/build";
import { desserializar, normalizarParaGravar, serializar } from "@/lib/content/serializacao";
import type { ContentRepository } from "@/lib/content/repository";
import type { ContentDoc, DocId } from "@/lib/content/types";

/** Linha da tabela public.documentos. */
export interface LinhaDocumento {
  user_id: string;
  id: string;
  secao: string;
  pagina: string;
  status: string;
  atualizado_em: string;
  atualizado_por: string;
  tags: string[] | null;
  relacionados: string[] | null;
  campos: Record<string, unknown> | null;
  itens: unknown[] | null;
  corpo: string | null;
  extras: Record<string, unknown> | null;
}

interface ErroSupabase {
  code?: string;
  message?: string;
}
interface Resposta<T> {
  data: T | null;
  error: ErroSupabase | null;
}

/**
 * Subconjunto do cliente Supabase que usamos (injetável nos testes).
 * O SupabaseClient real é compatível estruturalmente.
 */
export interface ClienteDocumentos {
  from(tabela: "documentos"): {
    select(colunas: string): {
      eq(coluna: string, valor: string): PromiseLike<Resposta<LinhaDocumento[]>> & {
        eq(coluna: string, valor: string): { maybeSingle(): PromiseLike<Resposta<LinhaDocumento>> };
      };
    };
    upsert(
      linha: LinhaDocumento,
      opcoes: { onConflict: string },
    ): { select(): { single(): PromiseLike<Resposta<LinhaDocumento>> } };
  };
}

const TABELA = "documentos";

/** Converte erro do Supabase em ErroConteudo SEM vazar mensagem, tabela ou SQL ao chamador. */
function mapearErro(erro: ErroSupabase): ErroConteudo {
  const codigo = erro.code ?? "";
  // Só o código vai para o log do servidor; a mensagem do banco pode conter nomes internos.
  console.error(`[supabase-repository] falha no banco (código ${codigo || "desconhecido"})`);
  if (codigo === "42501" || codigo === "PGRST301" || codigo === "PGRST303") {
    return new ErroConteudo("PROIBIDO", "Sem permissão para acessar este conteúdo.");
  }
  if (codigo === "40001" || codigo === "40P01") {
    return new ErroConteudo("CONFLITO", "Conflito ao gravar. Tente novamente.");
  }
  return new ErroConteudo("ERRO_INTERNO", "Não foi possível acessar o armazenamento do conteúdo.");
}

/** Linha → documento validado pelo schema da página (reaproveita o desserializar do .md). */
function linhaParaDocumento(linha: LinhaDocumento, id: DocId): ContentDoc {
  const def = obterDefinicao(id);
  const base = criarTemplate(def);
  const bruto: ContentDoc = {
    ...base,
    status: linha.status as ContentDoc["status"],
    atualizado_em: new Date(linha.atualizado_em).toISOString(),
    atualizado_por: linha.atualizado_por as ContentDoc["atualizado_por"],
    tags: linha.tags ?? [],
    relacionados: (linha.relacionados ?? []) as DocId[],
    campos: { ...base.campos, ...((linha.campos ?? {}) as ContentDoc["campos"]) },
    itens: (linha.itens ?? []) as ContentDoc["itens"],
    corpo: linha.corpo ?? "",
    extras: linha.extras ?? {},
  };
  return desserializar(serializar(bruto, def), def);
}

function documentoParaLinha(doc: ContentDoc, userId: string): LinhaDocumento {
  return {
    user_id: userId,
    id: doc.id,
    secao: doc.secao,
    pagina: doc.pagina,
    status: doc.status,
    atualizado_em: doc.atualizado_em,
    atualizado_por: doc.atualizado_por,
    tags: doc.tags,
    relacionados: doc.relacionados,
    campos: doc.campos,
    itens: doc.itens,
    corpo: doc.corpo,
    extras: doc.extras,
  };
}

export class SupabaseContentRepository implements ContentRepository {
  constructor(
    private readonly cliente: ClienteDocumentos,
    private readonly userId: string,
  ) {
    if (!userId) throw new ErroConteudo("NAO_AUTORIZADO", "Usuário não identificado.");
  }

  async list(): Promise<ContentDoc[]> {
    // Uma consulta só. O filtro por user_id é redundante com o RLS, mas protege o cliente admin (sem RLS).
    const { data, error } = await this.cliente.from(TABELA).select("*").eq("user_id", this.userId);
    if (error) throw mapearErro(error);
    const porId = new Map((data ?? []).map((l) => [l.id, l]));
    return DOC_IDS.map((id) => {
      const linha = porId.get(id);
      return linha ? linhaParaDocumento(linha, id) : criarTemplate(obterDefinicao(id));
    });
  }

  async get(id: DocId): Promise<ContentDoc> {
    if (!ehIdValido(id)) throw new ErroConteudo("NAO_ENCONTRADO", "Documento não encontrado.");
    const { data, error } = await this.cliente
      .from(TABELA)
      .select("*")
      .eq("user_id", this.userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw mapearErro(error);
    // Linha ausente: o documento existe logicamente, vazio. Leitura não grava nada.
    return data ? linhaParaDocumento(data, id) : criarTemplate(obterDefinicao(id));
  }

  async save(doc: ContentDoc): Promise<ContentDoc> {
    if (!ehIdValido(doc.id)) throw new ErroConteudo("NAO_ENCONTRADO", "Documento não encontrado.");
    // Valida ANTES de gravar: dado inválido nunca chega ao banco.
    const normalizado = normalizarParaGravar(doc, obterDefinicao(doc.id));
    const { error } = await this.cliente
      .from(TABELA)
      .upsert(documentoParaLinha(normalizado, this.userId), { onConflict: "user_id,id" })
      .select()
      .single();
    if (error) throw mapearErro(error);
    return normalizado;
  }
}
