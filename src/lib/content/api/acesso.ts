// src/lib/content/api/acesso.ts
// Guarda de acesso da API de contexto (§6.5). Fase 1: sem usuários; token opcional em dev.
import { createHash, timingSafeEqual } from "node:crypto";
import { respostaErro } from "@/lib/content/api/respostas";

function sha256(texto: string): Buffer {
  return createHash("sha256").update(texto, "utf8").digest();
}

/** Comparação em tempo constante sobre os hashes SHA-256 (sempre do mesmo tamanho). */
export function tokensIguais(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

/** Retorna uma Response de erro se o acesso for negado, ou null se liberado. */
export function verificarAcesso(req: Request): Response | null {
  const token = process.env.BUSINESSOS_API_TOKEN?.trim();
  if (token) {
    // Com token configurado, ele é exigido em TODOS os métodos e ambientes.
    const enviado = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
    if (!enviado || !tokensIguais(enviado, token)) {
      return respostaErro("NAO_AUTORIZADO", "Token ausente ou inválido.", {
        cabecalhos: { "WWW-Authenticate": "Bearer" },
      });
    }
    return null;
  }
  if (process.env.NODE_ENV === "production") {
    // Sem token em produção: API desligada (leitura e escrita).
    return respostaErro("PROIBIDO", "API desativada em produção sem BUSINESSOS_API_TOKEN.");
  }
  // Desenvolvimento local sem token: liberado.
  return null;
}
