"use client"

// Gaveta lateral (direita) de um item de coleção: mostra todos os campos e permite editar na hora.
// Salva só o item alterado, pela mesma callback do editor da página (com checagem de conflito).
import * as React from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import { CorpoItemForm } from "@/components/cards/item-form"
import { textoDoValor } from "@/components/cards/field-value"
import { estaVazio } from "@/components/cards/valores"
import type { PageEditorProps } from "@/components/editor/page-editor"
import { CelulaItem } from "@/components/relatorio/celula-item"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { CollectionDef } from "@/lib/content/schemas/field-types"
import type { Item } from "@/lib/content/types"
import { cn } from "@/lib/utils"

export interface GavetaItemProps {
  colecao: CollectionDef
  /** Item aberto; ausente = gaveta fechada. */
  item?: Item
  onFechar: () => void
  /** Versão do documento, para detectar edição concorrente. */
  atualizadoEm: string
  onSalvar: PageEditorProps["onSalvar"]
}

/** Casca da gaveta: o conteúdo remonta a cada item (key), então o modo edição sempre começa fechado. */
export function GavetaItem(props: GavetaItemProps) {
  const { item, onFechar } = props
  return (
    <Sheet open={Boolean(item)} onOpenChange={(aberto) => !aberto && onFechar()}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        {item && <ConteudoGaveta key={item.id} {...props} item={item} />}
      </SheetContent>
    </Sheet>
  )
}

function ConteudoGaveta({ colecao, item, atualizadoEm, onSalvar }: GavetaItemProps & { item: Item }) {
  const [editando, setEditando] = React.useState(false)
  const [salvando, iniciar] = React.useTransition()

  const campoTitulo = colecao.campos.find((c) => c.nome === colecao.campoTitulo)
  const titulo = campoTitulo && !estaVazio(item[campoTitulo.nome]) ? textoDoValor(campoTitulo, item[campoTitulo.nome]) : colecao.rotuloItem
  const campoSubtitulo = colecao.campos.find((c) => c.nome === colecao.campoSubtitulo)
  const subtitulo = campoSubtitulo && !estaVazio(item[campoSubtitulo.nome]) ? textoDoValor(campoSubtitulo, item[campoSubtitulo.nome]) : null

  const salvar = (novo: Item) => {
    iniciar(async () => {
      const r = await onSalvar({ itens: [novo] }, atualizadoEm)
      if (r.ok) {
        toast.success(`${colecao.rotuloItem} atualizado.`)
        setEditando(false)
      } else if (r.erro.codigo === "CONFLITO") {
        toast.error("A página mudou enquanto você editava. Feche a gaveta, releia e edite de novo.")
      } else {
        toast.error(r.erro.mensagem)
      }
    })
  }

  return (
    <>
      <SheetHeader className="border-b px-4 py-4 pr-12 md:px-6">
        <SheetTitle className="text-lg font-semibold break-words">{editando ? `Editar · ${titulo}` : titulo}</SheetTitle>
        <SheetDescription className="break-words">
          {editando ? "Campos com * são obrigatórios." : (subtitulo ?? colecao.rotuloItem)}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
        {editando ? (
          // O formulário só confirma depois de salvar: onAbertoChange vazio mantém a gaveta no modo edição
          <CorpoItemForm
            colecao={colecao}
            aberto
            onAbertoChange={() => {}}
            itemInicial={item}
            onConfirmar={salvar}
            onCancelar={() => setEditando(false)}
          />
        ) : (
          <dl className="space-y-4">
            {colecao.campos.map((c) => {
              const longo = c.tipo === "texto-longo" || c.tipo === "lista-texto" || textoDoValor(c, item[c.nome]).length > 40
              return (
                <div key={c.nome} className="space-y-1 border-b border-foreground/10 pb-3 last:border-b-0">
                  <dt className="text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{c.rotulo}</dt>
                  <dd className={cn("text-sm break-words [overflow-wrap:anywhere]", longo && "leading-relaxed whitespace-pre-line")}>
                    <CelulaItem campo={c} valor={item[c.nome] ?? null} />
                  </dd>
                </div>
              )
            })}
          </dl>
        )}
      </div>

      {!editando && (
        <div className="border-t p-4 md:px-6">
          <Button onClick={() => setEditando(true)} disabled={salvando} className="h-11 w-full md:h-9">
            <Pencil aria-hidden />
            Editar {colecao.rotuloItem.toLowerCase()}
          </Button>
        </div>
      )}
    </>
  )
}
