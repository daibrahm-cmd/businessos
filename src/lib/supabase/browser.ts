// src/lib/supabase/browser.ts
// Cliente para componentes de navegador ("use client"). Usa a chave pública + sessão em cookie.
import { createBrowserClient } from "@supabase/ssr";
import { chavePublica, urlSupabase } from "@/lib/supabase/env";

export function criarClienteNavegador() {
  return createBrowserClient(urlSupabase(), chavePublica());
}
