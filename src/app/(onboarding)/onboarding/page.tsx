import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { onboardingPendente } from "@/lib/onboarding/estado"
import { perfilAtual } from "@/lib/supabase/perfil"

export const metadata: Metadata = { title: "Bem-vindo" }
// Depende da sessão e do perfil: sempre renderizar na hora.
export const dynamic = "force-dynamic"

export default async function PaginaOnboarding() {
  const perfil = await perfilAtual()
  if (!perfil) redirect("/login")
  // Quem já concluiu (ou não precisa) não volta para cá.
  if (!(await onboardingPendente())) redirect("/")

  return <OnboardingWizard nomeInicial={perfil.nome} emailInicial={perfil.email} />
}
