// Selo do estágio do negócio (Fase 1: sempre "Sistema de marca viva").
import { Badge } from "@/components/ui/badge"
import { ESTAGIO_ATUAL, ROTULO_ESTAGIO, type Estagio } from "@/lib/content/navigation"
import { cn } from "@/lib/utils"

export interface StageBadgeProps {
  estagio?: Estagio
  className?: string
}

export function StageBadge({ estagio, className }: StageBadgeProps) {
  return (
    <Badge variant="outline" className={cn("text-[10px] tracking-wider text-muted-foreground uppercase", className)}>
      {ROTULO_ESTAGIO[estagio ?? ESTAGIO_ATUAL]}
    </Badge>
  )
}
