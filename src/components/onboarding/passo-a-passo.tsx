"use client"

// Onboarding: uma pergunta por vez (Founder e Direção), com progresso, e no fim uma revisão editável.
// Cada resposta é salva ao avançar, então dá para sair e voltar de onde parou.
import * as React from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Pencil, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { FieldInput } from "@/components/cards/field-input"
import { FieldValue } from "@/components/cards/field-value"
import { estaVazio, valoresIguais } from "@/components/cards/valores"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { campoPreenchido } from "@/lib/content/completude"
import { salvarDocumento } from "@/lib/content/actions"
import type { DocId } from "@/lib/content/navigation"
import type { FieldDef } from "@/lib/content/schemas/field-types"
import type { ValorCampo } from "@/lib/content/types"

/** Uma página com os campos que serão perguntados e as respostas já salvas. */
export interface PaginaOnboarding {
  id: DocId
  titulo: string
  secao: string
  campos: readonly FieldDef[]
  valores: Record<string, ValorCampo>
}

interface Pergunta {
  chave: string
  docId: DocId
  pagina: string
  secao: string
  campo: FieldDef
}

const chaveDe = (docId: string, nome: string) => `${docId}::${nome}`

/** Salva um campo; devolve true se deu certo (erro vira aviso na tela). */
async function salvarCampo(docId: DocId, nome: string, valor: ValorCampo): Promise<boolean> {
  const r = await salvarDocumento(docId, { campos: { [nome]: valor } })
  if (r.ok) return true
  toast.error(r.erro.campos ? Object.values(r.erro.campos)[0] : r.erro.mensagem)
  return false
}

export function PassoAPasso({ paginas }: { paginas: PaginaOnboarding[] }) {
  const perguntas = React.useMemo<Pergunta[]>(
    () =>
      paginas.flatMap((p) =>
        p.campos.map((campo) => ({ chave: chaveDe(p.id, campo.nome), docId: p.id, pagina: p.titulo, secao: p.secao, campo })),
      ),
    [paginas],
  )

  // Respostas atuais (na tela) e últimas salvas (no arquivo)
  const inicial = React.useMemo(() => {
    const m: Record<string, ValorCampo> = {}
    for (const p of paginas) for (const c of p.campos) m[chaveDe(p.id, c.nome)] = p.valores[c.nome] ?? null
    return m
  }, [paginas])
  const [respostas, setRespostas] = React.useState(inicial)
  const [salvas, setSalvas] = React.useState(inicial)

  // Começa na primeira pergunta sem resposta; se tudo está respondido, abre direto a revisão
  const primeiraVazia = perguntas.findIndex((q) => !campoPreenchido(q.campo, inicial[q.chave]))
  const [indice, setIndice] = React.useState(Math.max(primeiraVazia, 0))
  const [fase, setFase] = React.useState<"perguntas" | "revisao">(primeiraVazia === -1 ? "revisao" : "perguntas")
  const [salvando, setSalvando] = React.useState(false)

  const definir = (chave: string, valor: ValorCampo) => setRespostas((r) => ({ ...r, [chave]: valor }))

  /** Grava (se mudou) e devolve true se pode seguir. */
  const gravar = async (q: Pergunta): Promise<boolean> => {
    const valor = respostas[q.chave] ?? null
    if (valoresIguais(valor, salvas[q.chave])) return true
    setSalvando(true)
    const ok = await salvarCampo(q.docId, q.campo.nome, valor)
    setSalvando(false)
    if (ok) setSalvas((s) => ({ ...s, [q.chave]: valor }))
    return ok
  }

  const avancar = async () => {
    const q = perguntas[indice]
    if (!(await gravar(q))) return
    if (indice < perguntas.length - 1) setIndice(indice + 1)
    else setFase("revisao")
  }
  const voltar = async () => {
    // Não perde o que foi digitado: salva antes de voltar (se falhar, fica na pergunta)
    if (!(await gravar(perguntas[indice]))) return
    setIndice(Math.max(indice - 1, 0))
  }

  if (fase === "revisao") {
    return (
      <Revisao
        paginas={paginas}
        respostas={respostas}
        onSalvar={async (docId, nome, valor) => {
          const ok = await salvarCampo(docId, nome, valor)
          if (ok) {
            definir(chaveDe(docId, nome), valor)
            setSalvas((s) => ({ ...s, [chaveDe(docId, nome)]: valor }))
          }
          return ok
        }}
        onVoltarPerguntas={() => {
          const vazia = perguntas.findIndex((q) => !campoPreenchido(q.campo, respostas[q.chave]))
          setIndice(vazia === -1 ? perguntas.length - 1 : vazia)
          setFase("perguntas")
        }}
      />
    )
  }

  const q = perguntas[indice]
  const grupo = q.campo.grupo
  const progresso = Math.round((indice / perguntas.length) * 100)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Progresso */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Pergunta {indice + 1} de {perguntas.length}
          </span>
          <span>{progresso}%</span>
        </div>
        <Progress value={progresso} aria-label="Progresso das perguntas" />
      </div>

      {/* Uma pergunta por vez, dentro de um container */}
      <PerguntaCard
        key={q.chave}
        pergunta={q}
        grupo={grupo}
        valor={respostas[q.chave] ?? null}
        onChange={(v) => definir(q.chave, v)}
        onEnviar={avancar}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={voltar} disabled={indice === 0 || salvando} className="h-12 sm:h-11">
          <ArrowLeft aria-hidden /> Voltar
        </Button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => (indice < perguntas.length - 1 ? setIndice(indice + 1) : setFase("revisao"))}
            disabled={salvando}
            className="h-12 sm:h-11"
          >
            Pular
          </Button>
          <Button onClick={avancar} disabled={salvando} className="h-12 sm:h-11">
            {salvando ? "Salvando…" : indice === perguntas.length - 1 ? "Concluir" : "Próxima"}
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pergunta
// ---------------------------------------------------------------------------

function PerguntaCard({
  pergunta,
  grupo,
  valor,
  onChange,
  onEnviar,
}: {
  pergunta: Pergunta
  grupo?: string
  valor: ValorCampo
  onChange: (v: ValorCampo) => void
  onEnviar: () => void
}) {
  const id = `pergunta-${React.useId()}`
  const ref = React.useRef<HTMLDivElement>(null)

  // Foco no campo ao entrar na pergunta (fluxo de teclado)
  React.useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input, textarea, button[role='combobox']")?.focus()
  }, [])

  // Enter avança em campos de uma linha; em texto longo, Ctrl/⌘ + Enter (Enter quebra a linha)
  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
    const alvo = e.target as HTMLElement
    if (alvo.tagName === "INPUT" || ((e.metaKey || e.ctrlKey) && alvo.tagName === "TEXTAREA")) {
      e.preventDefault()
      onEnviar()
    }
  }

  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-5 p-5 sm:p-8" ref={ref} onKeyDown={aoTeclar}>
        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          {pergunta.secao} · {pergunta.pagina}
          {grupo ? ` · ${grupo}` : ""}
        </p>
        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-xl leading-snug font-semibold sm:text-2xl">
            {pergunta.campo.rotulo}
          </Label>
          {pergunta.campo.ajuda && (
            <p id={`${id}-ajuda`} className="text-sm text-muted-foreground">
              {pergunta.campo.ajuda}
            </p>
          )}
        </div>
        <FieldInput campo={pergunta.campo} valor={valor} onChange={onChange} id={id} />
        {pergunta.campo.tipo === "texto-longo" && (
          <p className="hidden text-xs text-muted-foreground sm:block">Ctrl/⌘ + Enter para avançar.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Revisão: todas as respostas, editáveis uma a uma
// ---------------------------------------------------------------------------

function Revisao({
  paginas,
  respostas,
  onSalvar,
  onVoltarPerguntas,
}: {
  paginas: PaginaOnboarding[]
  respostas: Record<string, ValorCampo>
  onSalvar: (docId: DocId, nome: string, valor: ValorCampo) => Promise<boolean>
  onVoltarPerguntas: () => void
}) {
  const [editando, setEditando] = React.useState<string | null>(null)
  const [rascunho, setRascunho] = React.useState<ValorCampo>(null)
  const [salvando, setSalvando] = React.useState(false)

  const total = paginas.reduce((n, p) => n + p.campos.length, 0)
  const respondidas = paginas.reduce(
    (n, p) => n + p.campos.filter((c) => campoPreenchido(c, respostas[chaveDe(p.id, c.nome)])).length,
    0,
  )

  const salvar = async (p: PaginaOnboarding, campo: FieldDef) => {
    setSalvando(true)
    const ok = await onSalvar(p.id, campo.nome, rascunho)
    setSalvando(false)
    if (ok) setEditando(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">Revise suas respostas</h2>
        <p className="text-sm text-muted-foreground">
          {respondidas} de {total} respondidas. Toque em Editar para mudar qualquer resposta. Tudo é salvo ao confirmar.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-12 sm:h-11">
            <Link href="/briefing">
              <Sparkles aria-hidden /> Ir para o briefing
            </Link>
          </Button>
          <Button variant="outline" onClick={onVoltarPerguntas} className="h-12 sm:h-11">
            Responder o que falta
          </Button>
        </div>
      </div>

      {paginas.map((p) => (
        <section key={p.id} className="space-y-3">
          <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {p.secao} · {p.titulo}
          </h3>
          {p.campos.map((campo) => {
            const chave = chaveDe(p.id, campo.nome)
            const valor = respostas[chave] ?? null
            const aEditar = editando === chave
            return (
              <Card key={chave} className="gap-3 py-4">
                <CardContent className="space-y-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium">{campo.rotulo}</p>
                      {!aEditar && <FieldValue campo={campo} valor={valor} />}
                    </div>
                    {!aEditar && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 shrink-0"
                        aria-label={`${estaVazio(valor) ? "Responder" : "Editar"}: ${campo.rotulo}`}
                        onClick={() => {
                          setEditando(chave)
                          setRascunho(valor)
                        }}
                      >
                        <Pencil aria-hidden /> {estaVazio(valor) ? "Responder" : "Editar"}
                      </Button>
                    )}
                  </div>
                  {aEditar && (
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                      <FieldInput campo={campo} valor={rascunho} onChange={setRascunho} id={`rev-${chave}`} />
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button variant="ghost" className="h-11" onClick={() => setEditando(null)} disabled={salvando}>
                          Cancelar
                        </Button>
                        <Button className="h-11" onClick={() => salvar(p, campo)} disabled={salvando}>
                          <Check aria-hidden /> {salvando ? "Salvando…" : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </section>
      ))}
    </div>
  )
}
