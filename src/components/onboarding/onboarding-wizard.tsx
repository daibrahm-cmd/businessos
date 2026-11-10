"use client"
// Onboarding em tela cheia: uma pergunta por vez (nome, e-mail, WhatsApp, empresa e porte).
// As respostas ficam em memória e só são gravadas no último passo (uma única chamada ao servidor).
import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { cn } from "cn"

import { MarcaDB } from "@/components/layout/marca-db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { concluirOnboardingAction, type ResultadoOnboarding } from "@/lib/onboarding/actions"
import {
  FAIXAS_FUNCIONARIOS,
  erroDoCampo,
  mascararWhatsapp,
  type ChaveOnboarding,
} from "@/lib/onboarding/schemas"

type Resposta = Record<ChaveOnboarding, string>

interface Passo {
  chave: ChaveOnboarding
  pergunta: string
  dica: string
  tipo: "text" | "email" | "tel" | "faixas"
  placeholder?: string
  autoComplete?: string
}

export const PASSOS: readonly Passo[] = [
  { chave: "nome", pergunta: "Qual é o seu nome?", dica: "Como devemos te chamar.", tipo: "text", placeholder: "Seu nome", autoComplete: "name" },
  {
    chave: "email",
    pergunta: "Qual é o seu e-mail?",
    dica: "É o e-mail de contato. O login continua o mesmo.",
    tipo: "email",
    placeholder: "voce@empresa.com.br",
    autoComplete: "email",
  },
  {
    chave: "whatsapp",
    pergunta: "Qual é o seu WhatsApp?",
    dica: "Com DDD. Usamos só para falar com você sobre o BusinessOS.",
    tipo: "tel",
    placeholder: "(11) 99999-8888",
    autoComplete: "tel-national",
  },
  { chave: "empresa", pergunta: "Qual o nome da sua empresa?", dica: "Se ainda não tem, use o nome do projeto.", tipo: "text", placeholder: "Nome da empresa", autoComplete: "organization" },
  { chave: "funcionarios", pergunta: "Quantos funcionários tem na sua empresa?", dica: "Uma estimativa já ajuda.", tipo: "faixas" },
]

interface Props {
  nomeInicial?: string
  emailInicial?: string
  /** Injetável para stories e testes; no app usa a Server Action. */
  aoConcluir?: (dados: Resposta) => Promise<ResultadoOnboarding>
}

export function OnboardingWizard({ nomeInicial = "", emailInicial = "", aoConcluir }: Props) {
  const router = useRouter()
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Resposta>({
    nome: nomeInicial,
    email: emailInicial,
    whatsapp: "",
    empresa: "",
    funcionarios: "",
  })
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, iniciarSalvar] = useTransition()

  const passo = PASSOS[indice]
  const ultimo = indice === PASSOS.length - 1
  const valor = respostas[passo.chave]

  function mudar(novo: string) {
    setErro(null)
    setRespostas((r) => ({ ...r, [passo.chave]: passo.chave === "whatsapp" ? mascararWhatsapp(novo) : novo }))
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (salvando) return
    const mensagem = erroDoCampo(passo.chave, valor)
    if (mensagem) return setErro(mensagem)
    if (!ultimo) {
      setErro(null)
      return setIndice(indice + 1)
    }
    iniciarSalvar(async () => {
      const resultado = await (aoConcluir ?? concluirOnboardingAction)(respostas)
      if (!resultado.ok) return setErro(resultado.mensagem)
      router.replace("/")
      router.refresh()
    })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex flex-col gap-4 px-4 pt-5 sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-base font-semibold tracking-tight">
            <MarcaDB className="h-6 w-auto text-sidebar-primary" />
            BusinessOS
          </div>
          <span className="text-xs tracking-widest text-muted-foreground uppercase" aria-hidden>
            {indice + 1} de {PASSOS.length}
          </span>
        </div>
        <Progress value={((indice + 1) / PASSOS.length) * 100} aria-label={`Passo ${indice + 1} de ${PASSOS.length}`} />
      </header>

      <form onSubmit={enviar} noValidate className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-10 sm:px-8">
        {/* key: remonta a cada passo, para o foco e a animação recomeçarem */}
        <div key={passo.chave} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-4xl leading-tight sm:text-5xl" id="pergunta">
              {passo.pergunta}
            </h1>
            <p className="text-sm text-muted-foreground" id="dica">
              {passo.dica}
            </p>
          </div>

          {passo.tipo === "faixas" ? (
            <div role="radiogroup" aria-labelledby="pergunta" aria-describedby="dica" className="flex flex-col gap-2">
              {FAIXAS_FUNCIONARIOS.map((f) => {
                const marcado = valor === f.valor
                return (
                  <label
                    key={f.valor}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-base transition-colors",
                      "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                      marcado ? "border-transparent bg-accent text-accent-foreground" : "border-input hover:bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="funcionarios"
                      value={f.valor}
                      checked={marcado}
                      onChange={() => mudar(f.valor)}
                      className="sr-only"
                      autoFocus={f.valor === (valor || FAIXAS_FUNCIONARIOS[0].valor)}
                    />
                    {f.rotulo}
                    {marcado && <Check className="size-5" aria-hidden />}
                  </label>
                )
              })}
            </div>
          ) : (
            <Input
              // 16px+ no celular evita o zoom automático do iOS
              className="h-14 rounded-xl px-4 text-xl md:text-xl"
              type={passo.tipo}
              inputMode={passo.tipo === "tel" ? "tel" : passo.tipo === "email" ? "email" : "text"}
              autoComplete={passo.autoComplete}
              placeholder={passo.placeholder}
              value={valor}
              onChange={(e) => mudar(e.target.value)}
              aria-labelledby="pergunta"
              aria-describedby={erro ? "erro dica" : "dica"}
              aria-invalid={erro ? true : undefined}
              autoFocus
            />
          )}

          <p id="erro" role="alert" className="min-h-5 text-sm text-destructive">
            {erro}
          </p>
        </div>

        {/* Rodapé fixo: Voltar e Continuar ficam à vista mesmo em telas baixas (celular na horizontal) */}
        <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 bg-background/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          <Button type="button" variant="ghost" size="lg" className="min-h-11" disabled={indice === 0 || salvando} onClick={() => { setErro(null); setIndice(indice - 1) }}>
            <ArrowLeft aria-hidden /> Voltar
          </Button>
          <Button type="submit" size="lg" className="min-h-11 min-w-36" disabled={salvando}>
            {salvando ? "Salvando…" : ultimo ? "Concluir" : "Continuar"}
            {!salvando && !ultimo && <ArrowRight aria-hidden />}
          </Button>
        </div>
      </form>
    </div>
  )
}
