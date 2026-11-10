// src/app/api/context/route.ts
// GET /api/context — contexto consolidado do negócio em JSON ou Markdown (§6.3).
// Dinâmico: o conteúdo muda por fora (agentes), então nada é pré-renderizado nem cacheado.
import { verificarAcesso } from "@/lib/content/api/acesso";
import {
  lerFormato,
  respostaDeErro,
  respostaErro,
  respostaFormatoInvalido,
  respostaJson,
  respostaMarkdown,
} from "@/lib/content/api/respostas";
import { comContextoApi } from "@/lib/content/repository";
import { exportarMarkdown } from "@/lib/content/exportar-md";
import { ESTAGIO_ATUAL, ehIdValido, ehSecaoValida, type DocId } from "@/lib/content/navigation";
import { DEFINICOES, type PageDefinition } from "@/lib/content/schemas";
import { listarDocumentos } from "@/lib/content/servico";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function tratarGET(req: Request): Promise<Response> {
  const negado = verificarAcesso(req);
  if (negado) return negado;

  try {
    const url = new URL(req.url);
    const formato = lerFormato(url);
    if (!formato) return respostaFormatoInvalido();

    const secao = url.searchParams.get("secao");
    if (secao !== null && !ehSecaoValida(secao)) {
      return respostaErro("NAO_ENCONTRADO", `Seção não encontrada: ${secao}.`);
    }

    // ?ids=a,b — vazios são ignorados; qualquer id fora da navegação → 404.
    let ids: Set<DocId> | null = null;
    const idsParam = url.searchParams.get("ids");
    if (idsParam !== null) {
      const pedidos = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const invalido = pedidos.find((id) => !ehIdValido(id));
      if (invalido !== undefined || pedidos.length === 0) {
        return respostaErro("NAO_ENCONTRADO", `Documento não encontrado: ${invalido ?? "(nenhum id)"}.`);
      }
      ids = new Set(pedidos as DocId[]);
    }

    // listarDocumentos já vem na ordem da navegação; secao + ids = interseção.
    const docs = (await listarDocumentos()).filter(
      (d) => (secao === null || d.secao === secao) && (ids === null || ids.has(d.id)),
    );
    const geradoEm = new Date().toISOString();

    if (formato === "md") {
      const defs = Object.fromEntries(docs.map((d) => [d.id, DEFINICOES[d.id]])) as Partial<
        Record<DocId, PageDefinition>
      >;
      return respostaMarkdown(exportarMarkdown(docs, defs, geradoEm));
    }

    const corpo: Record<string, unknown> = { gerado_em: geradoEm, estagio: ESTAGIO_ATUAL, documentos: docs };
    if (url.searchParams.get("definicoes") === "1") {
      corpo.definicoes = Object.fromEntries(docs.map((d) => [d.id, DEFINICOES[d.id]]));
    }
    return respostaJson(corpo);
  } catch (erro) {
    return respostaDeErro(erro);
  }
}

// Agentes (Bearer) rodam com o contexto "api": chave de serviço + BUSINESSOS_API_USER_ID.
export const GET = (req: Request): Promise<Response> => comContextoApi(() => tratarGET(req));
