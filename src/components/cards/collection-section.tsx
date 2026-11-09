"use client"

// Seção de uma coleção da página: resumos, cards dos itens (grade/lista) e o formulário de item.
import * as React from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CollectionDef } from "@/lib/content/schemas/field-types"
import type { Item, ResumoCalculado, ValorCampo } from "@/lib/content/types"

import { CardCollection } from "./card-collection"
import { CollectionSummary } from "./collection-summary"
import { ItemCard } from "./item-card"
import { ItemForm } from "./item-form"

export interface CollectionSectionProps {
  colecao: CollectionDef
  itens: Item[]
  pendentes: Record<string, "novo" | "editado">
  resumos: ResumoCalculado[]
  onSalvarItem: (item: Item) => void
  onRemoverItem: (itemId: string) => void
  /** Chave da preferência grade/lista. Padrão: "colecao:<nome>". O PageEditor passa "<docId>#<nome>". */
  chavePreferencia?: string
}

function ehVazio(v: ValorCampo | undefined): boolean {
  return v === null || v === undefined || v === ""
}

/** Compara dois valores não vazios (números por valor; textos e datas YYYY-MM-DD em ordem pt-BR). */
function comparar(a: ValorCampo | undefined, b: ValorCampo | undefined): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true })
}

/** Itens na ordem de exibição definida por `ordenarPor` (não altera a ordem gravada). */
export function ordenarItens(itens: Item[], colecao: CollectionDef): Item[] {
  const ordem = colecao.ordenarPor
  if (!ordem) return itens
  const sinal = ordem.direcao === "desc" ? -1 : 1
  return [...itens].sort((x, y) => {
    const a = x[ordem.campo]
    const b = y[ordem.campo]
    // Vazios ficam no fim nas duas direções
    if (ehVazio(a) || ehVazio(b)) return Number(ehVazio(a)) - Number(ehVazio(b))
    return sinal * comparar(a, b)
  })
}

export function CollectionSection({
  colecao,
  itens,
  pendentes,
  resumos,
  onSalvarItem,
  onRemoverItem,
  chavePreferencia,
}: CollectionSectionProps) {
  const [formAberto, setFormAberto] = React.useState(false)
  const [emEdicao, setEmEdicao] = React.useState<Item | undefined>()

  const ordenados = React.useMemo(() => ordenarItens(itens, colecao), [itens, colecao])
  const rotuloItem = colecao.rotuloItem.toLowerCase()

  const abrirNovo = () => {
    setEmEdicao(undefined)
    setFormAberto(true)
  }
  const abrirEdicao = (item: Item) => {
    setEmEdicao(item)
    setFormAberto(true)
  }

  const botaoAdicionar = (
    <Button onClick={abrirNovo} variant="outline" className="h-11 md:h-8">
      <Plus data-icon="inline-start" aria-hidden />
      Adicionar {rotuloItem}
    </Button>
  )

  return (
    <>
      <CardCollection
        chavePreferencia={chavePreferencia ?? `colecao:${colecao.nome}`}
        titulo={`${colecao.rotulo} (${itens.length})`}
        descricao={colecao.descricao}
        acoes={itens.length > 0 ? botaoAdicionar : undefined}
        topo={itens.length > 0 ? <CollectionSummary resumos={resumos} /> : undefined}
        vazio={
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum item em {colecao.rotulo.toLowerCase()} ainda.
            </p>
            {botaoAdicionar}
          </div>
        }
      >
        {ordenados.map((item) => (
          <ItemCard
            key={item.id}
            colecao={colecao}
            item={item}
            pendente={pendentes[item.id]}
            onEditar={() => abrirEdicao(item)}
            onRemover={() => onRemoverItem(item.id)}
          />
        ))}
      </CardCollection>

      <ItemForm
        colecao={colecao}
        aberto={formAberto}
        onAbertoChange={setFormAberto}
        itemInicial={emEdicao}
        onConfirmar={onSalvarItem}
      />
    </>
  )
}
