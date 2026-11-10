// Estado do onboarding da pessoa logada. Só servidor.
import { cache } from "react"

import { criarClienteServidor } from "@/lib/supabase/server"

/**
 * true quando a pessoa ainda precisa passar pelo onboarding.
 * FALHA ABERTA de propósito: sem sessão, sem a coluna (migration ainda não aplicada) ou com qualquer
 * erro de leitura devolve false, para o app nunca ficar preso numa tela de onboarding por defeito.
 */
export const onboardingPendente = cache(async (): Promise<boolean> => {
  try {
    const supabase = await criarClienteServidor()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return false
    const { data, error } = await supabase
      .from("perfis")
      .select("onboarding_concluido_em")
      .eq("id", auth.user.id)
      .maybeSingle()
    if (error || !data) return false
    return data.onboarding_concluido_em == null
  } catch {
    return false
  }
})
