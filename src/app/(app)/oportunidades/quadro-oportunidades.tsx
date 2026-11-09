"use client"

// Kanban de oportunidades: uma coluna por estágio. Mover = arrastar o cartão (mouse, toque e teclado,
// via @dnd-kit) ou o seletor no cartão; criar/editar/excluir = modal.
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { CartaoArrastavel, ColunaSoltavel, ContextoKanban } from "@/components/kanban/arrastar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatarMoeda } from "@/lib/format"
import { ESTAGIOS, ROTULOS_ESTAGIO, type Estagio, type Oportunidade } from "@/lib/oportunidades/tipos"
import { cn } from "@/lib/utils"

import { removerOportunidadeAction, salvarOportunidadeAction } from "./actions"

/** Rascunho do formulário: tudo texto, convertido ao salvar. */
interface Rascunho {
  id?: string
  lead: string
  empresa: string
  titulo: string
  valor: string
  estagio: Estagio
  contato: string
  proximo_passo: string
}

const VAZIO: Rascunho = { lead: "", empresa: "", titulo: "", valor: "", estagio: "novo", contato: "", proximo_passo: "" }

const CLASSE_SELECT =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

/** "1.500,50" ou "1500.5" → número; vazio → null; inválido → undefined. */
function lerValor(texto: string): number | null | undefined {
  const t = texto.trim().replace(/[R$\s]/g, "")
  if (!t) return null
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function doRascunho(o: Oportunidade): Rascunho {
  return {
    id: o.id,
    lead: o.lead,
    empresa: o.empresa ?? "",
    titulo: o.titulo,
    valor: o.valor === undefined ? "" : String(o.valor).replace(".", ","),
    estagio: o.estagio,
    contato: o.contato ?? "",
    proximo_passo: o.proximo_passo ?? "",
  }
}

export function QuadroOportunidades({ oportunidades: oportunidadesDoServidor }: { oportunidades: Oportunidade[] }) {
  const router = useRouter()
  // Cópia local: o cartão muda de coluna na hora e o servidor confirma em seguida
  const [oportunidades, setOportunidades] = useState(oportunidadesDoServidor)
  const [versaoVista, setVersaoVista] = useState(oportunidadesDoServidor)
  if (oportunidadesDoServidor !== versaoVista) {
    setVersaoVista(oportunidadesDoServidor)
    setOportunidades(oportunidadesDoServidor)
  }
  const [pendente, iniciar] = useTransition()
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [confirmaExcluir, setConfirmaExcluir] = useState(false)

  const aberto = rascunho !== null
  const campo = (k: keyof Rascunho) => (e: { target: { value: string } }) =>
    setRascunho((r) => (r ? { ...r, [k]: e.target.value } : r))

  const fechar = () => {
    setRascunho(null)
    setConfirmaExcluir(false)
  }

  function salvar() {
    if (!rascunho) return
    const valor = lerValor(rascunho.valor)
    if (!rascunho.lead.trim() || !rascunho.titulo.trim()) return toast.error("Preencha o lead e a oportunidade.")
    if (valor === undefined) return toast.error("Valor inválido. Use números, como 1500 ou 1.500,50.")
    iniciar(async () => {
      const r = await salvarOportunidadeAction({
        id: rascunho.id,
        lead: rascunho.lead,
        empresa: rascunho.empresa,
        titulo: rascunho.titulo,
        valor,
        estagio: rascunho.estagio,
        contato: rascunho.contato,
        proximo_passo: rascunho.proximo_passo,
      })
      if (!r.ok) {
        toast.error(r.mensagem)
        return
      }
      toast.success(rascunho.id ? "Oportunidade atualizada." : "Oportunidade criada.")
      fechar()
      router.refresh()
    })
  }

  function mover(o: Oportunidade, estagio: Estagio) {
    if (o.estagio === estagio) return
    const anteriores = oportunidades
    setOportunidades((atuais) =>
      atuais.map((x) => (x.id === o.id ? { ...x, estagio, atualizado_em: new Date().toISOString() } : x)),
    )
    iniciar(async () => {
      const r = await salvarOportunidadeAction({ id: o.id, estagio })
      if (!r.ok) {
        setOportunidades(anteriores)
        toast.error(r.mensagem)
        return
      }
      router.refresh()
    })
  }

  /** Soltou um cartão sobre uma coluna. */
  function aoSoltar(id: string, destino: string) {
    const estagio = ESTAGIOS.find((e) => e === destino)
    const o = oportunidades.find((x) => x.id === id)
    if (estagio && o) mover(o, estagio)
  }

  /** Conteúdo do cartão (o mesmo no quadro e na sobreposição enquanto arrasta), sem o seletor de estágio. */
  function textoDoCartao(o: Oportunidade) {
    return (
      <span className="block space-y-1 pr-6 text-left">
        <span className="block leading-snug font-medium">{o.titulo}</span>
        <span className="block text-xs text-muted-foreground">
          {o.lead}
          {o.empresa && ` · ${o.empresa}`}
        </span>
        {o.valor !== undefined && <span className="block text-xs font-medium tabular-nums">{formatarMoeda(o.valor)}</span>}
        {o.proximo_passo && <span className="block text-xs text-muted-foreground">Próximo: {o.proximo_passo}</span>}
      </span>
    )
  }

  function excluir() {
    if (!rascunho?.id) return
    const id = rascunho.id
    iniciar(async () => {
      const r = await removerOportunidadeAction(id)
      if (!r.ok) {
        toast.error(r.mensagem)
        return
      }
      toast.success("Oportunidade excluída.")
      fechar()
      router.refresh()
    })
  }

  // Valor em aberto = tudo que não está ganho nem perdido
  const emAberto = oportunidades
    .filter((o) => o.estagio !== "ganho" && o.estagio !== "perdido")
    .reduce((soma, o) => soma + (o.valor ?? 0), 0)
  const ganho = oportunidades.filter((o) => o.estagio === "ganho").reduce((soma, o) => soma + (o.valor ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">Em aberto</dt>
            <dd className="font-medium tabular-nums">{formatarMoeda(emAberto)}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wider text-muted-foreground uppercase">Ganho</dt>
            <dd className="font-medium tabular-nums">{formatarMoeda(ganho)}</dd>
          </div>
        </dl>
        <Button onClick={() => setRascunho({ ...VAZIO })} className="h-11 md:h-8">
          <Plus aria-hidden /> Nova oportunidade
        </Button>
      </div>

      {oportunidades.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Ainda não há oportunidades. Use “Nova oportunidade” para cadastrar o primeiro lead.
        </p>
      )}

      {/* Mobile: colunas lado a lado com rolagem horizontal; em telas grandes, 3 colunas por linha */}
      <ContextoKanban
        aoMover={aoSoltar}
        sobreposicao={(id) => {
          const o = oportunidades.find((x) => x.id === id)
          return o ? <div className="rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10">{textoDoCartao(o)}</div> : null
        }}
      >
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8 xl:mx-0 xl:grid xl:grid-cols-3 xl:overflow-visible xl:px-0 2xl:grid-cols-6">
        {ESTAGIOS.map((estagio) => {
          const lista = oportunidades
            .filter((o) => o.estagio === estagio)
            .sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em))
          const total = lista.reduce((soma, o) => soma + (o.valor ?? 0), 0)
          return (
            <ColunaSoltavel
              key={estagio}
              id={estagio}
              aria-labelledby={`estagio-${estagio}`}
              className="w-[82vw] max-w-sm shrink-0 snap-start space-y-3 rounded-xl bg-muted/40 p-3 xl:w-auto xl:max-w-none"
            >
              <header className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <h2 id={`estagio-${estagio}`} className="text-sm font-medium">
                    {ROTULOS_ESTAGIO[estagio]}
                  </h2>
                  <span className="text-xs tabular-nums text-muted-foreground">{lista.length}</span>
                </div>
                <p className="text-[11px] tabular-nums text-muted-foreground">{formatarMoeda(total)}</p>
              </header>
              {lista.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Vazio</p>
              ) : (
                <ul className="space-y-2">
                  {lista.map((o) => (
                    <CartaoArrastavel
                      key={o.id}
                      id={o.id}
                      rotulo={o.titulo}
                      className="space-y-2 rounded-lg bg-card p-3 text-sm ring-1 ring-foreground/10"
                    >
                      <button
                        type="button"
                        onClick={() => setRascunho(doRascunho(o))}
                        className="block w-full rounded-md text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {textoDoCartao(o)}
                      </button>
                      <label className="block">
                        <span className="sr-only">Mover “{o.titulo}” para</span>
                        <select
                          value={o.estagio}
                          disabled={pendente}
                          onChange={(e) => mover(o, e.target.value as Estagio)}
                          className={cn(CLASSE_SELECT, "h-11 text-xs md:h-7")}
                        >
                          {ESTAGIOS.map((e) => (
                            <option key={e} value={e}>
                              {ROTULOS_ESTAGIO[e]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </CartaoArrastavel>
                  ))}
                </ul>
              )}
            </ColunaSoltavel>
          )
        })}
      </div>
      </ContextoKanban>

      <Dialog open={aberto} onOpenChange={(o) => !o && fechar()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{rascunho?.id ? "Editar oportunidade" : "Nova oportunidade"}</DialogTitle>
            <DialogDescription>Lead, o que está sendo vendido e o próximo passo.</DialogDescription>
          </DialogHeader>
          {rascunho && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                salvar()
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="op-lead">Lead *</Label>
                  <Input id="op-lead" value={rascunho.lead} onChange={campo("lead")} maxLength={120} autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="op-empresa">Empresa</Label>
                  <Input id="op-empresa" value={rascunho.empresa} onChange={campo("empresa")} maxLength={120} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="op-titulo">Oportunidade *</Label>
                <Input id="op-titulo" value={rascunho.titulo} onChange={campo("titulo")} maxLength={160} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="op-valor">Valor (R$)</Label>
                  <Input id="op-valor" value={rascunho.valor} onChange={campo("valor")} inputMode="decimal" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="op-estagio">Estágio</Label>
                  <select id="op-estagio" value={rascunho.estagio} onChange={campo("estagio")} className={CLASSE_SELECT}>
                    {ESTAGIOS.map((e) => (
                      <option key={e} value={e}>
                        {ROTULOS_ESTAGIO[e]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="op-contato">Contato</Label>
                <Input id="op-contato" value={rascunho.contato} onChange={campo("contato")} maxLength={160} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="op-proximo">Próximo passo</Label>
                <Input
                  id="op-proximo"
                  value={rascunho.proximo_passo}
                  onChange={campo("proximo_passo")}
                  maxLength={300}
                />
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                {rascunho.id ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={pendente}
                    onClick={() => (confirmaExcluir ? excluir() : setConfirmaExcluir(true))}
                  >
                    {confirmaExcluir ? "Confirmar exclusão" : "Excluir"}
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={fechar}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={pendente}>
                    {pendente ? "Salvando…" : "Salvar"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
