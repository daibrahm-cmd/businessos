// Exibição somente leitura de um valor de campo, já formatado (moeda, número, data, lista…).
import type { FieldDef } from "@/lib/content/schemas/field-types"
import type { ValorCampo } from "@/lib/content/types"
import { formatarData, formatarMoeda, formatarNumero } from "@/lib/format"
import { cn } from "@/lib/utils"

import { estaVazio, rotuloDaOpcao } from "./valores"

export interface FieldValueProps {
  campo: FieldDef
  valor: ValorCampo
  /** Uma linha só, com reticências (cards de item). */
  compacto?: boolean
}

/** Texto formatado de um valor não vazio. */
export function textoDoValor(campo: FieldDef, valor: ValorCampo): string {
  switch (campo.tipo) {
    case "moeda":
      return typeof valor === "number" ? formatarMoeda(valor) : String(valor)
    case "numero":
      return typeof valor === "number" ? formatarNumero(valor, campo.unidade) : String(valor)
    case "data":
      return typeof valor === "string" ? formatarData(valor) : String(valor)
    case "selecao":
      return rotuloDaOpcao(campo, valor) ?? ""
    case "lista-texto":
      return Array.isArray(valor) ? valor.join(", ") : String(valor)
    default:
      return Array.isArray(valor) ? valor.join(", ") : String(valor)
  }
}

export function FieldValue({ campo, valor, compacto }: FieldValueProps) {
  if (estaVazio(valor)) {
    return <span className="text-sm text-muted-foreground italic">Não preenchido</span>
  }

  const numerico = campo.tipo === "moeda" || campo.tipo === "numero"

  if (compacto) {
    return (
      <span className={cn("block truncate text-sm", numerico && "tabular-nums")}>
        {textoDoValor(campo, valor)}
      </span>
    )
  }

  if (campo.tipo === "lista-texto" && Array.isArray(valor)) {
    return (
      <ul className="list-disc space-y-1 pl-5 text-sm break-words">
        {valor.map((linha, i) => (
          <li key={`${i}-${linha}`}>{linha}</li>
        ))}
      </ul>
    )
  }

  return (
    <p
      className={cn(
        "text-sm break-words",
        campo.tipo === "texto-longo" && "whitespace-pre-line",
        numerico && "tabular-nums",
      )}
    >
      {textoDoValor(campo, valor)}
    </p>
  )
}
