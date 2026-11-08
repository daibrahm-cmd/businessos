// Selo do status de uma página, em preto e branco (sem cor de acento).
import { Badge } from "@/components/ui/badge"
import type { Status } from "@/lib/content/types"
import { cn } from "@/lib/utils"

/** Rótulos PT-BR dos status, na ordem do fluxo de trabalho. */
export const ROTULOS_STATUS: Record<Status, string> = {
  vazio: "Vazio",
  rascunho: "Rascunho",
  "em-validacao": "Em validação",
  validado: "Validado",
}

/** Ordem de exibição dos status (selects, contagens). */
export const ORDEM_STATUS: readonly Status[] = ["vazio", "rascunho", "em-validacao", "validado"]

const VARIANTE: Record<Status, "outline" | "secondary" | "default"> = {
  vazio: "outline",
  rascunho: "secondary",
  "em-validacao": "outline",
  validado: "default",
}

export interface StatusBadgeProps {
  status: Status
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={VARIANTE[status]}
      data-status={status}
      className={cn(status === "vazio" && "border-dashed text-muted-foreground", className)}
    >
      {ROTULOS_STATUS[status]}
    </Badge>
  )
}
