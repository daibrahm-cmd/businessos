"use client"

// Cards dos agentes (avatar + nome) e o modal de edição. Clicar no agente abre o modal na própria página.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { AvatarAgente } from "@/components/agentes/avatar-agente"
import { CARD, ROTULO } from "@/components/relatorio/pecas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { hrefDoDocumento, NAVEGACAO, obterPagina, type DocId } from "@/lib/content/navigation"
import type { AgenteCompleto, SituacaoAgente } from "@/lib/workflow/agentes"
import { cn } from "@/lib/utils"

import { salvarAgenteAction } from "./actions"

type AgenteCard = AgenteCompleto & Omit<SituacaoAgente, keyof AgenteCompleto>

/** Lista de páginas como links curtos (ex.: "Oferta · Direção"). */
function Documentos({ rotulo, ids }: { rotulo: string; ids: readonly DocId[] }) {
  return (
    <div className="space-y-1.5">
      <p className={ROTULO}>{rotulo}</p>
      {ids.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nenhuma (só lê)</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {ids.map((id) => {
            const { secao, pagina } = obterPagina(id)
            return (
              <li key={id}>
                <Link
                  href={hrefDoDocumento(id)}
                  className="inline-block rounded-md border px-1.5 py-0.5 text-[11px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {pagina.titulo} · {secao.nome}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Marcar/desmarcar páginas, agrupadas por seção. */
function SeletorDocs({
  rotulo,
  valor,
  onChange,
  obrigatorio,
}: {
  rotulo: string
  valor: DocId[]
  onChange: (v: DocId[]) => void
  obrigatorio?: boolean
}) {
  const alternar = (id: DocId) => onChange(valor.includes(id) ? valor.filter((v) => v !== id) : [...valor, id])
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">
        {rotulo}
        {obrigatorio && " *"}
      </legend>
      <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border p-2.5">
        {NAVEGACAO.map((secao) => (
          <div key={secao.slug} className="space-y-1">
            <p className="text-[10px] tracking-wider text-muted-foreground uppercase">{secao.nome}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {secao.paginas.map((p) => {
                const id = `${secao.slug}/${p.slug}` as DocId
                return (
                  <label key={id} className="flex min-h-7 items-center gap-1.5 text-xs">
                    <input type="checkbox" checked={valor.includes(id)} onChange={() => alternar(id)} className="size-4 accent-primary" />
                    {p.titulo}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  )
}

interface Rascunho {
  apelido: string
  papel: string
  descricao: string
  le: DocId[]
  escreve: DocId[]
  instrucoes: string
}

export function ListaAgentes({ agentes }: { agentes: AgenteCard[] }) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [editando, setEditando] = useState<AgenteCard | null>(null)
  const [r, setR] = useState<Rascunho | null>(null)

  const abrir = (a: AgenteCard) => {
    setEditando(a)
    setR({
      apelido: a.apelido ?? "",
      papel: a.papel,
      descricao: a.descricao,
      le: [...a.le],
      escreve: [...a.escreve],
      instrucoes: a.instrucoes,
    })
  }
  const fechar = () => {
    setEditando(null)
    setR(null)
  }
  const campo = (k: "apelido" | "papel" | "descricao" | "instrucoes") => (e: { target: { value: string } }) =>
    setR((atual) => (atual ? { ...atual, [k]: e.target.value } : atual))

  function salvar() {
    if (!editando || !r) return
    if (!r.papel.trim() || !r.descricao.trim()) {
      toast.error("Preencha o papel e a descrição.")
      return
    }
    if (r.le.length === 0) {
      toast.error("Marque ao menos uma página em “Lê”.")
      return
    }
    iniciar(async () => {
      const res = await salvarAgenteAction(editando.nome, r)
      if (!res.ok) {
        toast.error(res.mensagem)
        return
      }
      toast.success("Agente atualizado.")
      fechar()
      router.refresh()
    })
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {agentes.map((a) => {
          const ativo = a.emAndamento.length > 0
          return (
            <article key={a.nome} className={cn(CARD, "space-y-4")}>
              <header className="space-y-3">
                <div className="flex items-start gap-3">
                  {/* Avatar + nome abrem o modal de edição */}
                  <button
                    type="button"
                    onClick={() => abrir(a)}
                    aria-label={`Editar ${a.apelido ?? a.nome}`}
                    className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <AvatarAgente nome={a.nome} tamanho={52} />
                    <span className="min-w-0">
                      <span className="block truncate text-lg leading-tight font-semibold group-hover:underline">
                        {a.apelido ?? a.nome}
                      </span>
                      <Badge variant="secondary" className="mt-1 font-mono text-[11px]">
                        {a.nome}
                      </Badge>
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        aria-hidden
                        className={cn("size-2 rounded-full", ativo ? "animate-pulse bg-primary" : "border border-foreground/50")}
                      />
                      {ativo ? "Trabalhando" : "Ocioso"}
                    </span>
                    <Button variant="ghost" size="icon-sm" onClick={() => abrir(a)} aria-label={`Editar ${a.apelido ?? a.nome}`}>
                      <Pencil aria-hidden />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">{a.papel}</h3>
                  <p className="text-sm text-muted-foreground">{a.descricao}</p>
                </div>
              </header>
              {ativo && <p className="rounded-lg bg-muted px-3 py-2 text-sm">{a.emAndamento.map((t) => t.titulo).join(" · ")}</p>}
              <div className="space-y-3 border-t pt-3">
                <Documentos rotulo="Lê" ids={a.le} />
                <Documentos rotulo="Escreve" ids={a.escreve} />
                {a.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <p className={ROTULO}>Skills</p>
                    <p className="font-mono text-xs text-muted-foreground">{a.skills.join(" · ")}</p>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <Dialog open={editando !== null} onOpenChange={(aberto) => !aberto && fechar()}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
          {editando && r && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <AvatarAgente nome={editando.nome} tamanho={48} />
                  <div>
                    <DialogTitle>Editar · {editando.apelido ?? editando.nome}</DialogTitle>
                    <DialogDescription>
                      <span className="font-mono">agents/{editando.nome}.md</span> · o nome técnico não muda.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  salvar()
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ag-apelido">Nome do agente</Label>
                    <Input id="ag-apelido" value={r.apelido} onChange={campo("apelido")} maxLength={40} placeholder={editando.nome} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ag-papel">Papel *</Label>
                    <Input id="ag-papel" value={r.papel} onChange={campo("papel")} maxLength={120} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ag-descricao">Descrição *</Label>
                  <Textarea id="ag-descricao" value={r.descricao} onChange={campo("descricao")} maxLength={300} rows={3} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SeletorDocs rotulo="Lê" obrigatorio valor={r.le} onChange={(le) => setR({ ...r, le })} />
                  <SeletorDocs rotulo="Escreve" valor={r.escreve} onChange={(escreve) => setR({ ...r, escreve })} />
                </div>
                {editando.skills.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Skills (edite no arquivo): <span className="font-mono">{editando.skills.join(" · ")}</span>
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="ag-instrucoes">Instruções (Markdown)</Label>
                  <Textarea
                    id="ag-instrucoes"
                    value={r.instrucoes}
                    onChange={campo("instrucoes")}
                    rows={12}
                    className="font-mono text-xs"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={fechar}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={pendente}>
                    {pendente ? "Salvando…" : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
