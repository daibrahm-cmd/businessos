// Layout do onboarding: tela cheia, sem o menu lateral do app (a pessoa só responde e segue).
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-dvh w-full">{children}</main>
}
