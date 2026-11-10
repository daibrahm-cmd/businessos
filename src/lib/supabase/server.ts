// src/lib/supabase/server.ts
// Cliente para Server Components, Server Actions e rotas. Lê/grava a sessão nos cookies.
// As consultas rodam COMO o usuário logado, então o RLS isola os dados de cada pessoa.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { chavePublica, urlSupabase } from "@/lib/supabase/env";

export async function criarClienteServidor() {
  const jar = await cookies();
  return createServerClient(urlSupabase(), chavePublica(), {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) jar.set(name, value, options);
        } catch {
          // Chamado de um Server Component (cookies somente leitura): o proxy renova a sessão.
        }
      },
    },
  });
}
