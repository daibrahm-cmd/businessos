"use client"

// Card de um campo da página: rótulo, ajuda e input (ou valor formatado, se somente leitura).
import * as React from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import type { FieldDef } from "@/lib/content/schemas/field-types"
import type { ValorCampo } from "@/lib/content/types"
import { cn } from "@/lib/utils"

import { useModoColecao } from "./card-collection"
import { FieldInput } from "./field-input"
import { FieldValue } from "./field-value"

export interface FieldCardProps {
  campo: FieldDef
  valor: ValorCampo
  onChange: (v: ValorCampo) => void
  /** Valor difere do último salvo. */
  modificado?: boolean
  /** Erro vindo do servidor (ou do PageEditor) para este campo. */
  erro?: string
  somenteLeitura?: boolean
}

/** Ponto "alterado, não salvo" ao lado do rótulo. */
export function MarcaModificado() {
  return (
    <>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-foreground" />
      <span className="sr-only">alterado, não salvo</span>
    </>
  )
}

export function FieldCard({ campo, valor, onChange, modificado, erro, somenteLeitura }: FieldCardProps) {
  const modo = useModoColecao()
  const id = `campo-${campo.nome}-${React.useId()}`

  return (
    <Card
      data-modificado={modificado ? "" : undefined}
      className={cn(
        "gap-3 py-4",
        // Em lista o card ocupa a largura toda e textos longos ganham mais linhas
        modo === "lista" && campo.tipo === "texto-longo" && "[&_textarea]:min-h-40",
      )}
    >
      <CardHeader className="gap-1 px-4">
        <div className="flex min-w-0 items-center gap-2">
          {somenteLeitura ? (
            <span className="text-sm font-medium">{campo.rotulo}</span>
          ) : (
            <Label htmlFor={id} className="text-sm font-medium">
              {campo.rotulo}
            </Label>
          )}
          {modificado && <MarcaModificado />}
        </div>
        {campo.ajuda && (
          <p id={`${id}-ajuda`} className="text-xs text-muted-foreground">
            {campo.ajuda}
          </p>
        )}
      </CardHeader>
      <CardContent className="px-4">
        {somenteLeitura ? (
          <FieldValue campo={campo} valor={valor} />
        ) : (
          <FieldInput campo={campo} valor={valor} onChange={onChange} id={id} erro={erro} />
        )}
      </CardContent>
    </Card>
  )
}
