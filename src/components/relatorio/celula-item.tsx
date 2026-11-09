// Valor curto de um campo de item, como aparece nos cards em lista e na gaveta:
// selo para seleção, barra para número com máximo, texto nos demais.
import { textoDoValor } from "@/components/cards/field-value"
import { estaVazio } from "@/components/cards/valores"
import type { FieldDef } from "@/lib/content/schemas/field-types"
import type { ValorCampo } from "@/lib/content/types"
import { cn } from "@/lib/utils"

/** Estilo do selo de estágio, por valor da opção (valores desconhecidos usam só o contorno). */
export const ESTILO_ESTAGIO: Record<string, string> = {
  novo: "bg-transparent text-muted-foreground ring-1 ring-foreground/25",
  contatado: "bg-[#B0C2C2]/25 text-[#B0C2C2]",
  qualificado: "bg-[#3F495A] text-[#EFEFEF] dark:bg-[#B0C2C2] dark:text-[#373634]",
  "em-negociacao": "bg-primary/20 text-primary",
  ganho: "bg-primary text-primary-foreground",
  perdido: "text-muted-foreground/60 ring-1 ring-foreground/15 line-through",
}

export function CelulaItem({ campo, valor }: { campo: FieldDef; valor: ValorCampo }) {
  if (estaVazio(valor)) return <span className="text-muted-foreground/50">—</span>
  if (campo.tipo === "selecao") {
    return (
      <span
        className={cn(
          "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
          ESTILO_ESTAGIO[String(valor)] ?? "ring-1 ring-foreground/25",
        )}
      >
        {textoDoValor(campo, valor)}
      </span>
    )
  }
  if (campo.tipo === "numero" && typeof valor === "number" && campo.max) {
    return (
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-14 overflow-hidden rounded-full bg-foreground/15">
          <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (valor / campo.max) * 100)}%` }} />
        </span>
        <span className="tabular-nums">{valor}</span>
      </span>
    )
  }
  // Data só com dia: textoDoValor trata sem deslocar o fuso (formatarDataCurta é para data e hora)
  return <span className={cn(campo.tipo === "data" && "tabular-nums")}>{textoDoValor(campo, valor)}</span>
}
