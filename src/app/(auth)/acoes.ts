"use server";
// Server Actions de autenticação: entrar, cadastrar e sair.
// Erros sempre genéricos: nunca revelam se um e-mail já existe.
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { cadastrarSchema, entrarSchema, errosPorCampo, type EstadoAuth } from "@/lib/auth/schemas";
import { proximoSeguro } from "@/lib/auth/proximo";
import { criarClienteServidor } from "@/lib/supabase/server";

const texto = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

export async function entrar(_anterior: EstadoAuth, form: FormData): Promise<EstadoAuth> {
  const parse = entrarSchema.safeParse({ email: texto(form, "email"), senha: texto(form, "senha") });
  const valores = { email: texto(form, "email").trim() };
  if (!parse.success) return { campos: errosPorCampo(parse.error), valores };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email: parse.data.email, password: parse.data.senha });
  if (error) return { erro: "E-mail ou senha incorretos.", valores };

  redirect(proximoSeguro(texto(form, "proximo")));
}

export async function cadastrar(_anterior: EstadoAuth, form: FormData): Promise<EstadoAuth> {
  const bruto = {
    nome: texto(form, "nome") || undefined,
    email: texto(form, "email"),
    senha: texto(form, "senha"),
    confirmar: texto(form, "confirmar"),
  };
  const valores = { nome: texto(form, "nome"), email: texto(form, "email").trim() };
  const parse = cadastrarSchema.safeParse(bruto);
  if (!parse.success) return { campos: errosPorCampo(parse.error), valores };

  // Origem para o link do e-mail de confirmação
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https");
  const emailRedirectTo = host ? `${proto}://${host}/auth/confirmar` : undefined;

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email: parse.data.email,
    password: parse.data.senha,
    options: { data: { nome: parse.data.nome ?? "" }, emailRedirectTo },
  });

  if (error) {
    // Senha fraca/vazada é seguro informar; o resto fica genérico
    if (error.code === "weak_password") {
      return { campos: { senha: "Senha fraca demais. Use uma senha mais longa e menos previsível." }, valores };
    }
    return { erro: "Não foi possível concluir o cadastro. Tente novamente em instantes.", valores };
  }

  // Confirmação de e-mail desligada: já veio com sessão
  if (data.session) redirect("/");

  // Resposta idêntica exista o e-mail ou não
  return { aviso: "Enviamos um link de confirmação para o seu e-mail. Abra-o para ativar a conta e entrar.", valores: {} };
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
