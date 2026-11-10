// src/proxy.ts
// Proxy do Next 16 (antigo middleware): renova a sessão do Supabase a cada requisição e
// protege as rotas. Usa getUser() (valida o token no Auth), nunca getSession().
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { proximoSeguro, rotaPublica, rotaSoVisitante } from "@/lib/auth/proximo";
import { chavePublica, urlSupabase } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // APIs de contexto/workflow usam o Bearer próprio: não mexer.
  if (pathname === "/api/context" || pathname.startsWith("/api/context/") || pathname === "/api/workflow" || pathname.startsWith("/api/workflow/")) {
    return NextResponse.next();
  }

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(urlSupabase(), chavePublica(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        // Grava na requisição (para os Server Components) e na resposta (para o navegador)
        for (const { name, value } of lista) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of lista) resposta.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const logado = !!data.user;

  /** Redireciona preservando os cookies de sessão renovados. */
  const redirecionar = (destino: URL) => {
    const r = NextResponse.redirect(destino);
    for (const c of resposta.cookies.getAll()) r.cookies.set(c);
    return r;
  };

  if (!logado && !rotaPublica(pathname)) {
    // APIs não-HTML respondem 401 em vez de redirecionar
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ erro: { codigo: "NAO_AUTENTICADO", mensagem: "Faça login." } }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const proximo = proximoSeguro(`${pathname}${search}`, "/");
    if (proximo !== "/") url.searchParams.set("proximo", proximo);
    return redirecionar(url);
  }

  if (logado && rotaSoVisitante(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirecionar(url);
  }

  return resposta;
}

export const config = {
  // Ignora assets estáticos, imagens otimizadas e arquivos com extensão (public/)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff2?)$).*)"],
};
