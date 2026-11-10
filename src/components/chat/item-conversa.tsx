"use client"

// Card de uma conversa na lista lateral: o card inteiro abre a conversa; o menu "…" renomeia ou exclui.
import * as React from "react"
import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { formatarDataHora } from "@/lib/format"
import type { ResumoConversa } from "@/lib/conversas/tipos"
import { cn } from "@/lib/utils"

export interface ItemConversaProps {
  conversa: ResumoConversa
  ativa?: boolean
  /** Retorna uma mensagem de erro amigável, ou null se deu certo. */
  onRenomear: (id: string, titulo: string) => Promise<string | null>
  onExcluir: (id: string) => Promise<string | null>
  /** Chamado ao abrir a conversa (fecha o painel no mobile). */
  onAbrir?: () => void
}

export function ItemConversa({ conversa, ativa = false, onRenomear, onExcluir, onAbrir }: ItemConversaProps) {
  const [renomeando, setRenomeando] = React.useState(false)
  const [excluindo, setExcluindo] = React.useState(false)
  const [titulo, setTitulo] = React.useState(conversa.titulo)
  const [ocupado, setOcupado] = React.useState(false)
  const [erro, setErro] = React.useState<string | null>(null)

  const abrirRenomear = () => {
    setTitulo(conversa.titulo)
    setErro(null)
    setRenomeando(true)
  }

  const confirmarRenomear = async (e: React.FormEvent) => {
    e.preventDefault()
    const novo = titulo.trim()
    if (novo === "" || ocupado) return
    setOcupado(true)
    const falha = await onRenomear(conversa.id, novo)
    setOcupado(false)
    if (falha) setErro(falha)
    else setRenomeando(false)
  }

  const confirmarExcluir = async () => {
    setOcupado(true)
    const falha = await onExcluir(conversa.id)
    setOcupado(false)
    if (falha) setErro(falha)
    else setExcluindo(false)
  }

  return (
    <>
      <div
        className={cn(
          "group/item relative rounded-lg border transition-colors",
          // Ativo: Marinho/Carvão no claro e Grisalho com texto Carvão no escuro (igual ao item ativo da sidebar principal)
          ativa
            ? "border-transparent bg-[#3F495A] text-[#EFEFEF] dark:bg-[#B0C2C2] dark:text-[#373634]"
            : "border-border bg-card hover:bg-muted",
        )}
      >
        <Link
          href={`/principal/${conversa.id}`}
          onClick={onAbrir}
          aria-current={ativa ? "page" : undefined}
          className="flex min-h-14 flex-col justify-center gap-0.5 rounded-lg py-2 pr-12 pl-3 outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring"
        >
          <span className="truncate text-[12.5px] font-medium">{conversa.titulo}</span>
          <span className={cn("truncate text-[10.5px]", ativa ? "opacity-75" : "text-muted-foreground")}>
            {formatarDataHora(conversa.atualizadoEm)}
          </span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Opções da conversa ${conversa.titulo}`}
              className={cn(
                "absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring md:size-8",
                ativa ? "hover:bg-white/15 dark:hover:bg-black/10" : "text-muted-foreground hover:bg-background hover:text-foreground",
              )}
            >
              <MoreHorizontal aria-hidden className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={abrirRenomear}>
              <Pencil aria-hidden /> Renomear
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                setErro(null)
                setExcluindo(true)
              }}
            >
              <Trash2 aria-hidden /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={renomeando} onOpenChange={(aberto) => !ocupado && setRenomeando(aberto)}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={confirmarRenomear} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Renomear conversa</DialogTitle>
              <DialogDescription className="sr-only">Escolha um novo título para a conversa.</DialogDescription>
            </DialogHeader>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              aria-label="Título da conversa"
              maxLength={120}
              autoFocus
              className="h-11 md:h-8"
            />
            {erro && (
              <p role="alert" className="text-sm text-destructive">
                {erro}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" className="h-11 md:h-8" onClick={() => setRenomeando(false)} disabled={ocupado}>
                Cancelar
              </Button>
              <Button type="submit" className="h-11 md:h-8" disabled={ocupado || titulo.trim() === ""}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={excluindo} onOpenChange={(aberto) => !ocupado && setExcluindo(aberto)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              “{conversa.titulo}” e todas as mensagens dela serão apagadas. Isso não pode ser desfeito.
              {erro && (
                <span role="alert" className="mt-2 block text-destructive">
                  {erro}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ocupado}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={ocupado}
              onClick={(e) => {
                // Mantém o diálogo aberto até a exclusão terminar (ou falhar)
                e.preventDefault()
                void confirmarExcluir()
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
