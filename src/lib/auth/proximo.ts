// src/lib/auth/proximo.ts
// Lógica pura de redirecionamento pós-login. Evita "open redirect": só aceita caminho interno.

/** Rotas de autenticação: nunca servem de destino depois do login (evita laço). */
const PREFIXOS_AUTH = ["/login", "/cadastro", "/auth"];

/**
 * Valida o parâmetro `proximo`. Devolve o caminho (com query/hash) se for interno e seguro;
 * caso contrário devolve `padrao`.
 */
export function proximoSeguro(valor: string | null | undefined, padrao = "/"): string {
  if (!valor || typeof valor !== "string") return padrao;
  if (valor.length > 2000) return padrao;
  // Precisa começar com uma única "/" (bloqueia "//host", "/\host", "http://..." e "javascript:")
  if (!valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) return padrao;
  // Caracteres de controle ou barra invertida podem ser normalizados pelo navegador para "//"
  if (/[\\\u0000-\u001f\u007f]/.test(valor)) return padrao;
  // Confirma que resolve para a mesma origem
  try {
    const base = "http://interno.local";
    const url = new URL(valor, base);
    if (url.origin !== base) return padrao;
    if (PREFIXOS_AUTH.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return padrao;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return padrao;
  }
}

/** Rotas que o proxy deixa passar sem exigir sessão (páginas de auth e APIs com Bearer próprio). */
export function rotaPublica(pathname: string): boolean {
  const ehOuFilho = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  return (
    pathname === "/login" ||
    pathname === "/cadastro" ||
    ehOuFilho("/auth") ||
    ehOuFilho("/api/context") ||
    ehOuFilho("/api/workflow")
  );
}

/** Páginas que não fazem sentido para quem já está logado. */
export function rotaSoVisitante(pathname: string): boolean {
  return pathname === "/login" || pathname === "/cadastro";
}
