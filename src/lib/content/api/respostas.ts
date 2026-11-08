// src/lib/content/api/respostas.ts
// Helpers de resposta da API de contexto: JSON, Markdown e erro no formato comum (§6.1).
// Toda resposta sai com Cache-Control: no-store e nenhum cabeçalho CORS.
import { ErroConteudo, STATUS_HTTP, type CodigoErro, type DetalheErro } from "@/lib/content/errors";

const SEM_CACHE = { "Cache-Control": "no-store" } as const;

/** Formatos aceitos em `?format=`. */
export type FormatoApi = "json" | "md";

/** Resposta JSON (UTF-8, sem cache). */
export function respostaJson(corpo: unknown, status = 200, cabecalhos: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...SEM_CACHE, "Content-Type": "application/json; charset=utf-8", ...cabecalhos },
  });
}

/** Resposta Markdown (UTF-8, sem cache). */
export function respostaMarkdown(texto: string): Response {
  return new Response(texto, {
    status: 200,
    headers: { ...SEM_CACHE, "Content-Type": "text/markdown; charset=utf-8" },
  });
}

/** Erro no formato comum: { erro: { codigo, mensagem, detalhes? } } (+ documento em CONFLITO). */
export function respostaErro(
  codigo: CodigoErro,
  mensagem: string,
  opcoes: { detalhes?: DetalheErro[]; documento?: unknown; cabecalhos?: Record<string, string> } = {},
): Response {
  const erro: { codigo: CodigoErro; mensagem: string; detalhes?: DetalheErro[] } = { codigo, mensagem };
  if (opcoes.detalhes && opcoes.detalhes.length > 0) erro.detalhes = opcoes.detalhes;
  const corpo: { erro: typeof erro; documento?: unknown } = { erro };
  if (opcoes.documento !== undefined) corpo.documento = opcoes.documento;
  return respostaJson(corpo, STATUS_HTTP[codigo], opcoes.cabecalhos);
}

/**
 * Converte qualquer erro lançado pelo serviço em Response.
 * ErroConteudo → código/status dele; outros → ERRO_INTERNO sem stack nem caminhos (log no servidor).
 */
export function respostaDeErro(erro: unknown): Response {
  if (erro instanceof ErroConteudo) {
    if (erro.codigo === "ERRO_INTERNO") console.error("[api/context]", erro);
    return respostaErro(erro.codigo, erro.message, {
      detalhes: erro.detalhes,
      documento: erro.codigo === "CONFLITO" ? erro.documentoAtual : undefined,
    });
  }
  console.error("[api/context] erro inesperado", erro);
  return respostaErro("ERRO_INTERNO", "Erro interno. Tente de novo.");
}

/** Lê `?format=` (padrão json). Retorna null para valor desconhecido. */
export function lerFormato(url: URL): FormatoApi | null {
  const valor = url.searchParams.get("format");
  if (valor === null || valor === "json") return "json";
  if (valor === "md") return "md";
  return null;
}

/** Resposta padrão para `format` desconhecido. */
export function respostaFormatoInvalido(): Response {
  return respostaErro("FORMATO_INVALIDO", 'Formato inválido. Use "json" ou "md".');
}
