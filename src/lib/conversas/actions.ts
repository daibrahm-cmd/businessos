"use server"
// Server Actions das conversas: validam o id (vem do cliente) e nunca lançam para a UI.
import { z } from "zod"
import { repositorioDoUsuario } from "@/lib/conversas/acesso"
import { ErroConversas, type RepositorioConversas } from "@/lib/conversas/repositorio"
import type { Conversa, ResumoConversa } from "@/lib/conversas/tipos"
import { perfilAtual } from "@/lib/supabase/perfil"

type Falha = { ok: false; mensagem: string }

const idSchema = z.string().uuid()
const tituloSchema = z.string().trim().min(1).max(120)

/** Roda `fn` com o repositório do usuário logado; qualquer erro vira { ok: false } com texto seguro. */
async function comRepositorio<T extends object>(
  fn: (repo: RepositorioConversas) => Promise<T | Falha>,
): Promise<({ ok: true } & T) | Falha> {
  try {
    const perfil = await perfilAtual()
    if (!perfil) return { ok: false, mensagem: "Sessão expirada. Faça login de novo." }
    const resultado = await fn(await repositorioDoUsuario(perfil.id))
    return "ok" in resultado ? (resultado as Falha) : { ok: true, ...resultado }
  } catch (e) {
    if (e instanceof ErroConversas) return { ok: false, mensagem: "Conversa não encontrada." }
    console.error("[conversas]", e)
    return { ok: false, mensagem: "Não foi possível concluir. Tente de novo." }
  }
}

const idInvalido: Falha = { ok: false, mensagem: "Conversa não encontrada." }

export async function listarConversasAction(): Promise<{ ok: true; conversas: ResumoConversa[] } | Falha> {
  return comRepositorio(async (repo) => ({ conversas: await repo.listarConversas() }))
}

export async function obterConversaAction(id: string): Promise<{ ok: true; conversa: Conversa } | Falha> {
  if (!idSchema.safeParse(id).success) return idInvalido
  return comRepositorio(async (repo) => {
    const conversa = await repo.obterConversa(id)
    return conversa ? { conversa } : idInvalido
  })
}

export async function renomearConversaAction(id: string, titulo: string): Promise<{ ok: true } | Falha> {
  if (!idSchema.safeParse(id).success) return idInvalido
  const t = tituloSchema.safeParse(titulo)
  if (!t.success) return { ok: false, mensagem: "Informe um título de até 120 caracteres." }
  return comRepositorio(async (repo) => {
    await repo.renomear(id, t.data)
    return {}
  })
}

export async function excluirConversaAction(id: string): Promise<{ ok: true } | Falha> {
  if (!idSchema.safeParse(id).success) return idInvalido
  return comRepositorio(async (repo) => {
    await repo.excluir(id)
    return {}
  })
}
