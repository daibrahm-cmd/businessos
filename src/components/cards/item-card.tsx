"use client"

// Card de um item de coleção (ex.: um cliente). O card inteiro abre a edição;
// o menu "…" oferece Editar e Remover (com confirmação).
import * as React from "react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { CollectionDef } from "@/lib/content/schemas/field-types"
import type { Item } from "@/lib/content/types"
import { cn } from "@/lib/utils"

import { useModoColecao } from "./card-collection"
import { FieldValue } from "./field-value"
import { estaVazio, rotuloDaOpcao } from "./valores"

export interface ItemCardProps {
  colecao: CollectionDef
  item: Item
  /** Item criado ou alterado no rascunho e ainda não salvo. */
  pendente?: "novo" | "editado"
  onEditar: () => void
  onRemover: () => void
}

export function ItemCard({ colecao, item, pendente, onEditar, onRemover }: ItemCardProps) {
  const modo = useModoColecao()
  const [confirmandoRemocao, setConfirmandoRemocao] = React.useState(false)

  const campoSubtitulo = colecao.campos.find((c) => c.nome === colecao.campoSubtitulo)
  const campoDestaque = colecao.campos.find((c) => c.nome === colecao.campoDestaque)
  const titulo = item[colecao.campoTitulo]
  const textoTitulo =
    typeof titulo === "string" && titulo.trim() !== "" ? titulo : `${colecao.rotuloItem} sem nome`
  const destaque = campoDestaque ? rotuloDaOpcao(campoDestaque, item[campoDestaque.nome]) : null

  // Demais campos preenchidos (fora título/subtítulo/destaque): 4 na grade, 2 na lista
  const outros = colecao.campos
    .filter(
      (c) =>
        c.nome !== colecao.campoTitulo &&
        c.nome !== colecao.campoSubtitulo &&
        c.nome !== colecao.campoDestaque &&
        !estaVazio(item[c.nome]),
    )
    .slice(0, modo === "grade" ? 4 : 2)

  const subtitulo =
    campoSubtitulo && !estaVazio(item[campoSubtitulo.nome]) ? (
      <span className="text-xs text-muted-foreground">
        <FieldValue campo={campoSubtitulo} valor={item[campoSubtitulo.nome]} compacto />
      </span>
    ) : null

  const marcaPendente = pendente ? (
    <span className="shrink-0 text-xs text-muted-foreground italic">
      {pendente === "novo" ? "novo · não salvo" : "não salvo"}
    </span>
  ) : null

  // Botão do título se estende sobre o card inteiro (after:inset-0): clique/Enter → editar
  const botaoTitulo = (
    <button
      type="button"
      onClick={onEditar}
      className="block max-w-full truncate text-left text-sm font-medium outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
    >
      {textoTitulo}
      <span className="sr-only">, editar {colecao.rotuloItem.toLowerCase()}</span>
    </button>
  )

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Ações do item"
          className="relative z-10 -my-1 size-11 shrink-0 md:size-8"
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEditar} className="min-h-11 md:min-h-8">
          <Pencil aria-hidden />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => setConfirmandoRemocao(true)}
          className="min-h-11 md:min-h-8"
        >
          <Trash2 aria-hidden />
          Remover
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const badge = destaque ? (
    <Badge variant="outline" className="relative shrink-0">
      {destaque}
    </Badge>
  ) : null

  return (
    <>
      <Card
        data-pendente={pendente}
        className={cn(
          "relative transition-colors hover:bg-accent/50 motion-reduce:transition-none",
          pendente && "ring-foreground/30",
          modo === "grade" ? "gap-3 py-4" : "gap-0 py-0",
        )}
      >
        {modo === "grade" ? (
          <>
            <div className="flex items-start gap-2 px-4">
              <div className="min-w-0 flex-1 space-y-0.5">
                {botaoTitulo}
                {subtitulo}
              </div>
              {badge}
              {menu}
            </div>
            {outros.length > 0 && (
              <dl className="grid gap-2 px-4">
                {outros.map((campo) => (
                  <div key={campo.nome} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{campo.rotulo}</dt>
                    <dd className="min-w-0">
                      <FieldValue campo={campo} valor={item[campo.nome]} compacto />
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {marcaPendente && <div className="px-4">{marcaPendente}</div>}
          </>
        ) : (
          <div className="flex min-h-14 items-center gap-3 px-4 py-2">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 sm:max-w-[40%]">{botaoTitulo}</div>
              {subtitulo && <div className="min-w-0 sm:max-w-[25%]">{subtitulo}</div>}
              {outros.length > 0 && (
                <dl className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
                  {outros.map((campo) => (
                    <div key={campo.nome} className="min-w-0 flex-1">
                      <dt className="sr-only">{campo.rotulo}</dt>
                      <dd className="min-w-0 text-muted-foreground">
                        <FieldValue campo={campo} valor={item[campo.nome]} compacto />
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            {marcaPendente}
            {badge}
            {menu}
          </div>
        )}
      </Card>

      <AlertDialog open={confirmandoRemocao} onOpenChange={setConfirmandoRemocao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {colecao.rotuloItem.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação será aplicada quando você salvar a página.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onRemover}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
