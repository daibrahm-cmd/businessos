"use server"
// Server Action que conclui o onboarding: valida tudo de novo no servidor e grava no perfil da pessoa logada.
import { onboardingSchema } from "@/lib/onboarding/schemas"
import { criarClienteServidor } from "@/lib/supabase/server"

export type ResultadoOnboarding = { ok: true } | { ok: false; mensagem: string }

export async function concluirOnboardingAction(dados: unknown): Promise<ResultadoOnboarding> {
  const parse = onboardingSchema.safeParse(dados)
  if (!parse.success) {
    return { ok: false, mensagem: parse.error.issues[0]?.message ?? "Confira as respostas e tente de novo." }
  }

  try {
    const supabase = await criarClienteServidor()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo." }

    const { nome, email, whatsapp, empresa, funcionarios } = parse.data
    // O RLS e o grant por coluna garantem que só a própria linha, e só estas colunas, podem mudar.
    const { data, error } = await supabase
      .from("perfis")
      .update({
        nome,
        email_contato: email,
        whatsapp,
        empresa,
        funcionarios,
        onboarding_concluido_em: new Date().toISOString(),
      })
      .eq("id", auth.user.id)
      .select("id")

    if (error || !data || data.length === 0) {
      // Só o código vai para o log: nada de dados pessoais.
      console.error("[onboarding] falha ao gravar o perfil:", error?.code ?? "sem linha")
      return { ok: false, mensagem: "Não foi possível salvar agora. Tente novamente em instantes." }
    }
    return { ok: true }
  } catch (erro) {
    console.error("[onboarding] erro inesperado:", erro instanceof Error ? erro.name : "desconhecido")
    return { ok: false, mensagem: "Não foi possível salvar agora. Tente novamente em instantes." }
  }
}
