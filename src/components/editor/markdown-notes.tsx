"use client"

// Notas livres da página (corpo Markdown): aba para escrever e aba para pré-visualizar.
import * as React from "react"

import { MarcaModificado } from "@/components/cards/field-card"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { renderMarkdownSimples } from "@/lib/markdown/render-simples"

export interface MarkdownNotesProps {
  valor: string
  onChange: (v: string) => void
  placeholder?: string
  modificado?: boolean
}

export function MarkdownNotes({ valor, onChange, placeholder, modificado }: MarkdownNotesProps) {
  const id = React.useId()
  const idTitulo = `${id}-titulo`

  return (
    <section aria-labelledby={idTitulo} className="space-y-4">
      <Tabs defaultValue="escrever" className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 id={idTitulo} className="text-base font-semibold">
              Notas
            </h2>
            {modificado && <MarcaModificado />}
          </div>
          <TabsList>
            <TabsTrigger value="escrever" className="min-h-9 px-3">
              Escrever
            </TabsTrigger>
            <TabsTrigger value="visualizar" className="min-h-9 px-3">
              Visualizar
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="escrever">
          <Textarea
            id={`${id}-texto`}
            aria-labelledby={idTitulo}
            aria-describedby={`${id}-dica`}
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder ?? "Escreva aqui o que não cabe nos campos."}
            className="field-sizing-content min-h-60"
          />
          <p id={`${id}-dica`} className="mt-1.5 text-xs text-muted-foreground">
            Aceita Markdown simples: # títulos, listas com -, **negrito**, *itálico* e [links](https://…).
          </p>
        </TabsContent>

        <TabsContent value="visualizar">
          <Card className="min-h-60 px-4 py-4">
            {valor.trim() === "" ? (
              <p className="text-sm text-muted-foreground italic">Nada escrito ainda.</p>
            ) : (
              renderMarkdownSimples(valor)
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}
