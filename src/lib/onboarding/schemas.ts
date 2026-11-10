// Validação das perguntas do onboarding (zod). Mensagens em português.
// Usado no navegador (a cada passo) e no servidor (ao concluir): a regra é uma só.
import { z } from "zod"

export const FAIXAS_FUNCIONARIOS = [
  { valor: "so-eu", rotulo: "Só eu" },
  { valor: "2-10", rotulo: "De 2 a 10" },
  { valor: "11-50", rotulo: "De 11 a 50" },
  { valor: "51-200", rotulo: "De 51 a 200" },
  { valor: "200+", rotulo: "Mais de 200" },
] as const

export type FaixaFuncionarios = (typeof FAIXAS_FUNCIONARIOS)[number]["valor"]

/** Só os dígitos, sem o 55 do país (se vier). */
export function digitosDoWhatsapp(bruto: string): string {
  const d = bruto.replace(/\D/g, "")
  return (d.length === 12 || d.length === 13) && d.startsWith("55") ? d.slice(2) : d
}

/** Máscara de exibição: (11) 99999-8888 (aceita número incompleto enquanto a pessoa digita). */
export function mascararWhatsapp(bruto: string): string {
  const d = digitosDoWhatsapp(bruto).slice(0, 11)
  if (d.length <= 2) return d
  const ddd = d.slice(0, 2)
  const resto = d.slice(2)
  const corte = resto.length > 8 ? 5 : 4
  return resto.length <= corte ? `(${ddd}) ${resto}` : `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

const nome = z
  .string({ error: "Conte como podemos te chamar." })
  .trim()
  .min(2, "Conte como podemos te chamar.")
  .max(80, "Nome longo demais.")

const email = z
  .string({ error: "Informe seu e-mail." })
  .trim()
  .toLowerCase()
  .min(1, "Informe seu e-mail.")
  .max(254, "E-mail longo demais.")
  .pipe(z.email("Informe um e-mail válido."))

/** Celular ou fixo do Brasil com DDD; guarda em formato internacional (+5511999998888). */
const whatsapp = z
  .string({ error: "Informe seu WhatsApp." })
  .transform(digitosDoWhatsapp)
  .refine((d) => /^[1-9][1-9](9[0-9]{8}|[2-5][0-9]{7})$/.test(d), "Informe o WhatsApp com DDD, por exemplo (11) 99999-8888.")
  .transform((d) => `+55${d}`)

const empresa = z
  .string({ error: "Informe o nome da sua empresa." })
  .trim()
  .min(1, "Informe o nome da sua empresa.")
  .max(100, "Nome da empresa longo demais.")

const funcionarios = z.enum(["so-eu", "2-10", "11-50", "51-200", "200+"], {
  error: "Escolha uma das opções.",
})

export const onboardingSchema = z.object({
  nome,
  email,
  whatsapp,
  empresa,
  funcionarios,
})

export type DadosOnboarding = z.infer<typeof onboardingSchema>
export type ChaveOnboarding = keyof DadosOnboarding

/** Valida só uma pergunta (usado a cada passo). Devolve a mensagem de erro ou null. */
export function erroDoCampo(chave: ChaveOnboarding, valor: string): string | null {
  const r = onboardingSchema.shape[chave].safeParse(valor)
  return r.success ? null : (r.error.issues[0]?.message ?? "Valor inválido.")
}
