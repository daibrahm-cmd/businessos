// Selo do estágio do negócio (Fase 1: sempre "Para quem está começando").
import { Badge } from "@/components/ui/badge"
import { ESTAGIO_ATUAL, ROTULO_ESTAGIO, type Estagio } from "@/lib/content/navigation"
import { cn } from "@/lib/utils"

export interface StageBadgeProps {
  estagio?: Estagio
  className?: string
}

export function StageBadge({ estagio, className }: StageBadgeProps) {
  return (
    <Badge variant="outline" className={cn("text-muted-foreground", className)}>
      {ROTULO_ESTAGIO[estagio ?? ESTAGIO_ATUAL]}
    </Badge>
  )
}
