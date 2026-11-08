"use server";
// Server Actions da UI (§6.2). Toda entrada é tratada como não confiável e validada no serviço.
// Actions nunca lançam para o cliente: sempre devolvem um ResultadoAcao.
import { revalidatePath } from "next/cache";

import { ErroConteudo, type CodigoErro } from "@/lib/content/errors";
import { ehIdValido } from "@/lib/content/navigation";
import { atualizarDocumento } from "@/lib/content/servico";
import type { ContentDoc, DocPatch } from "@/lib/content/types";

export type ResultadoAcao =
  | { ok: true; documento: ContentDoc }
  | {
      ok: false;
      erro: {
        codigo: CodigoErro;
        mensagem: string;
        /** Erros por caminho ("campos.preco", "itens.2.nome") para exibir junto ao campo. */
        campos?: Record<string, string>;
      };
      /** Presente em CONFLITO. */
      documentoAtual?: ContentDoc;
    };

/** Salva o rascunho da página inteira (campos, itens, notas e status alterados). */
export async function salvarDocumento(
  id: string,
  patch: DocPatch,
  esperadoAtualizadoEm?: string,
): Promise<ResultadoAcao> {
  if (!ehIdValido(id)) {
    return { ok: false, erro: { codigo: "NAO_ENCONTRADO", mensagem: "Página não encontrada." } };
  }
  // A precondição só é aceita como texto; qualquer outro valor vindo do cliente é ignorado.
  const esperado = typeof esperadoAtualizadoEm === "string" ? esperadoAtualizadoEm : undefined;

  try {
    const documento = await atualizarDocumento({ id, patch, autor: "humano", esperadoAtualizadoEm: esperado });
    // Sidebar (status), home, índices e a própria página leem o documento novo.
    revalidatePath("/", "layout");
    return { ok: true, documento };
  } catch (erro) {
    if (erro instanceof ErroConteudo) {
      const campos = erro.detalhes?.length
        ? Object.fromEntries(erro.detalhes.map((d) => [d.caminho, d.mensagem]))
        : undefined;
      return {
        ok: false,
        erro: { codigo: erro.codigo, mensagem: erro.message, ...(campos ? { campos } : {}) },
        ...(erro.codigo === "CONFLITO" && erro.documentoAtual
          ? { documentoAtual: erro.documentoAtual as ContentDoc }
          : {}),
      };
    }
    console.error("[salvarDocumento] erro inesperado ao salvar", id, erro);
    return { ok: false, erro: { codigo: "ERRO_INTERNO", mensagem: "Não foi possível salvar. Tente de novo." } };
  }
}
