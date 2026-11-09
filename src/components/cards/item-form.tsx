"use client"

// Formulário (Dialog) para adicionar ou editar um item de coleção.
// Gerado a partir da CollectionDef e validado no cliente com o mesmo schema do servidor.
// Não persiste nada: entrega o item pronto em onConfirmar (o PageEditor guarda no rascunho).
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { criarSchemaItemCompleto, valorPadrao } from "@/lib/content/schemas/build"
import type { CollectionDef } from "@/lib/content/schemas/field-types"
import type { Item, ValorCampo } from "@/lib/content/types"

import { FieldInput } from "./field-input"

export interface ItemFormProps {
  colecao: CollectionDef
  aberto: boolean
  onAbertoChange: (a: boolean) => void
  /** Item em edição; ausente = novo item. */
  itemInicial?: Item
  onConfirmar: (item: Item) => void
  /** Erros por nome de campo vindos do servidor. */
  errosServidor?: Record<string, string>
}

/** Id de item como na §3.1: 10 caracteres hexadecimais. */
export function gerarIdItem(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 10)
}

/** Item novo com todos os campos no valor padrão. */
function itemVazio(colecao: CollectionDef): Item {
  const item: Item = { id: "", colecao: colecao.nome }
  for (const campo of colecao.campos) item[campo.nome] = valorPadrao(campo)
  return item
}

export function ItemForm(props: ItemFormProps) {
  const { colecao, aberto, onAbertoChange, itemInicial } = props
  const editando = Boolean(itemInicial)

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editando ? "Editar" : "Adicionar"} {colecao.rotuloItem.toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            {colecao.descricao ?? "Campos com * são obrigatórios."}
          </DialogDescription>
        </DialogHeader>
        {/* O conteúdo remonta a cada abertura (o Dialog desmonta ao fechar): estado sempre limpo */}
        <CorpoItemForm {...props} />
      </DialogContent>
    </Dialog>
  )
}

/** Corpo do formulário, reutilizável fora do Dialog (a gaveta do lead usa). onCancelar troca o fechar do Dialog. */
export function CorpoItemForm({
  colecao,
  itemInicial,
  onConfirmar,
  onAbertoChange,
  errosServidor,
  onCancelar,
}: ItemFormProps & { onCancelar?: () => void }) {
  const [item, setItem] = React.useState<Item>(() =>
    itemInicial ? { ...itemVazio(colecao), ...itemInicial } : itemVazio(colecao),
  )
  const [erros, setErros] = React.useState<Record<string, string>>(errosServidor ?? {})
  const prefixoId = React.useId()
  const schema = React.useMemo(() => criarSchemaItemCompleto(colecao), [colecao])

  const alterar = (nome: string, valor: ValorCampo) => {
    setItem((atual) => ({ ...atual, [nome]: valor }))
    // Ao mexer no campo, o erro dele some até a próxima validação
    setErros((atuais) => {
      if (!(nome in atuais)) return atuais
      const resto = { ...atuais }
      delete resto[nome]
      return resto
    })
  }

  const concluir = (evento: React.FormEvent) => {
    evento.preventDefault()
    const candidato: Item = { ...item, id: item.id || gerarIdItem() }
    const resultado = schema.safeParse(candidato)
    if (!resultado.success) {
      const porCampo: Record<string, string> = {}
      for (const issue of resultado.error.issues) {
        const nome = String(issue.path[0] ?? "")
        if (nome && !(nome in porCampo)) porCampo[nome] = issue.message
      }
      setErros(porCampo)
      // Leva o foco ao primeiro campo com erro
      const primeiro = colecao.campos.find((c) => c.nome in porCampo)
      if (primeiro) document.getElementById(`${prefixoId}-${primeiro.nome}`)?.focus()
      return
    }
    onConfirmar(resultado.data)
    onAbertoChange(false)
  }

  return (
    <form onSubmit={concluir} noValidate className="space-y-5">
      {colecao.campos.map((campo) => {
        const id = `${prefixoId}-${campo.nome}`
        return (
          <div key={campo.nome} className="space-y-1.5">
            <Label htmlFor={id}>
              {campo.rotulo}
              {campo.obrigatorio && (
                <span aria-hidden className="text-muted-foreground">
                  {" *"}
                </span>
              )}
              {campo.obrigatorio && <span className="sr-only"> (obrigatório)</span>}
            </Label>
            {campo.ajuda && (
              <p id={`${id}-ajuda`} className="text-xs text-muted-foreground">
                {campo.ajuda}
              </p>
            )}
            <FieldInput
              campo={campo}
              id={id}
              valor={item[campo.nome] ?? valorPadrao(campo)}
              onChange={(v) => alterar(campo.nome, v)}
              erro={erros[campo.nome]}
            />
          </div>
        )
      })}

      <DialogFooter>
        {onCancelar ? (
          <Button type="button" variant="outline" className="h-11 md:h-8" onClick={onCancelar}>
            Cancelar
          </Button>
        ) : (
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-11 md:h-8">
              Cancelar
            </Button>
          </DialogClose>
        )}
        <Button type="submit" className="h-11 md:h-8">
          Concluir
        </Button>
      </DialogFooter>
    </form>
  )
}
