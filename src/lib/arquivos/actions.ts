"use server";
// src/lib/arquivos/actions.ts
// Server Actions finas sobre o serviço. Devolvem resultado serializável (nunca lançam para a UI).
import {
  enviarArquivo,
  listarArquivos,
  removerArquivo,
  urlAssinada,
} from "@/lib/arquivos/servico";
import type { Arquivo } from "@/lib/arquivos/tipos";
import { ErroArquivo } from "@/lib/arquivos/validar";
import { ErroNaoAutenticado } from "@/lib/supabase/usuario";

export type ResultadoAcao<T> = { ok: true; dados: T } | { ok: false; erro: string };

/** Converte exceções em mensagens seguras; erros desconhecidos viram texto genérico. */
async function executar<T>(fn: () => Promise<T>): Promise<ResultadoAcao<T>> {
  try {
    return { ok: true, dados: await fn() };
  } catch (e) {
    if (e instanceof ErroArquivo || e instanceof ErroNaoAutenticado) return { ok: false, erro: e.message };
    return { ok: false, erro: "Algo deu errado. Tente novamente." };
  }
}

/** FormData: campo `arquivo` (File) e, opcional, `docId` (string). */
export async function enviarArquivoAction(formData: FormData): Promise<ResultadoAcao<Arquivo>> {
  return executar(async () => {
    const arquivo = formData.get("arquivo");
    if (!(arquivo instanceof File)) throw new ErroArquivo("VAZIO", "Selecione um arquivo.");
    const doc = formData.get("docId");
    return enviarArquivo(arquivo, { docId: typeof doc === "string" && doc ? doc : undefined });
  });
}

export async function listarArquivosAction(docId?: string): Promise<ResultadoAcao<Arquivo[]>> {
  return executar(() => listarArquivos({ docId }));
}

export async function urlAssinadaAction(id: string): Promise<ResultadoAcao<string>> {
  return executar(() => urlAssinada(id));
}

export async function removerArquivoAction(id: string): Promise<ResultadoAcao<null>> {
  return executar(async () => {
    await removerArquivo(id);
    return null;
  });
}
