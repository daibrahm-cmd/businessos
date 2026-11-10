// src/app/auth/confirmar/route.ts
// Destino do link de confirmação de e-mail enviado pelo Supabase (verifyOtp com token_hash).
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { proximoSeguro } from "@/lib/auth/proximo";
import { criarClienteServidor } from "@/lib/supabase/server";

const TIPOS: readonly EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const tipo = params.get("type") as EmailOtpType | null;
  const destino = proximoSeguro(params.get("proximo"));

  if (tokenHash && tipo && TIPOS.includes(tipo)) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(destino, request.url));
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("erro", "link");
  return NextResponse.redirect(url);
}
