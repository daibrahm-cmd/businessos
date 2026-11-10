// src/lib/content/servico.ts
// Serviço de conteúdo: único caminho de leitura e escrita para UI e API (trava por id + merge + validação).
// Sem "use cache" aqui: a decisão de cache fica para as rotas (Onda 3).
import { agendarIndexacaoDocumento } from "@/lib/conhecimento";
import { ErroConteudo, detalhesDoZod } from "@/lib/content/errors";
import { ehIdValido } from "@/lib/content/navigation";
import { calcularCompletude } from "@/lib/content/completude";
import { aplicarPatch } from "@/lib/content/merge";
import { getContentRepository } from "@/lib/content/repository";
import { criarSchemaPatch } from "@/lib/content/schemas/build";
import { obterDefinicao } from "@/lib/content/schemas";
import type { Autor, ContentDoc, DocId } from "@/lib/content/types";
import { formatarDataHora } from "@/lib/format";

/** Fila de promessas por id: cada escrita espera a anterior do mesmo documento terminar. */
const travas = new Map<DocId, Promise<unknown>>();

async function comTrava<T>(id: DocId, tarefa: () => Promise<T>): Promise<T> {
  const anterior = travas.get(id) ?? Promise.resolve();
  const atual = anterior.catch(() => undefined).then(tarefa);
  travas.set(id, atual);
  try {
    return await atual;
  } finally {
    // Remove a entrada só se ninguém encadeou depois desta chamada.
    if (travas.get(id) === atual) travas.delete(id);
  }
}

function exigirId(id: unknown): DocId {
  if (!ehIdValido(id)) throw new ErroConteudo("NAO_ENCONTRADO", "Documento não encontrado.");
  return id;
}

/** Mesmo instante? Compara como data (aceita "Z" vs ".000Z"); se não for data, compara o texto. */
function mesmoInstante(a: string, b: string): boolean {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  return Number.isNaN(ta) || Number.isNaN(tb) ? a === b : ta === tb;
}

/** Os 13 documentos, na ordem da navegação. */
export async function listarDocumentos(): Promise<ContentDoc[]> {
  return getContentRepository().list();
}

/** Um documento (template se o arquivo ainda não existe). */
export async function lerDocumento(id: DocId): Promise<ContentDoc> {
  return getContentRepository().get(exigirId(id));
}

/**
 * Aplica um patch parcial e grava. Passos (§5.4): validar patch → ler atual → conferir conflito →
 * merge → status automático → carimbo de autor/data → gravar.
 */
export async function atualizarDocumento(params: {
  id: DocId;
  patch: unknown;
  autor: Autor;
  esperadoAtualizadoEm?: string;
}): Promise<ContentDoc> {
  const id = exigirId(params.id);
  return comTrava(id, async () => {
    const repo = getContentRepository();
    const def = obterDefinicao(id);

    const validado = criarSchemaPatch(def).safeParse(params.patch);
    if (!validado.success) {
      throw new ErroConteudo(
        "PAYLOAD_INVALIDO",
        `Dados inválidos para a página ${id}.`,
        detalhesDoZod(validado.error.issues),
      );
    }

    // Propaga CONTEUDO_INVALIDO: nunca sobrescrever um arquivo inválido.
    const atual = await repo.get(id);

    if (params.esperadoAtualizadoEm !== undefined && !mesmoInstante(params.esperadoAtualizadoEm, atual.atualizado_em)) {
      throw new ErroConteudo(
        "CONFLITO",
        `O documento foi alterado por ${atual.atualizado_por} em ${formatarDataHora(atual.atualizado_em)}.`,
        undefined,
        atual,
      );
    }

    const novo = aplicarPatch(atual, validado.data, def);

    // Status automático: só de "vazio" para "rascunho", nunca rebaixa.
    if (
      validado.data.status === undefined &&
      novo.status === "vazio" &&
      (calcularCompletude(novo, def).preenchidos > 0 || novo.corpo.trim() !== "")
    ) {
      novo.status = "rascunho";
    }

    novo.atualizado_em = new Date().toISOString();
    novo.atualizado_por = params.autor;
    const salvo = await repo.save(novo);
    // Atualiza a base de conhecimento em segundo plano: não bloqueia nem quebra o salvamento.
    agendarIndexacaoDocumento(salvo.id);
    return salvo;
  });
}
