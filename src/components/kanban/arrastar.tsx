"use client"

// Peças de arrastar e soltar dos Kanbans (Workflow e Oportunidades), sobre o @dnd-kit/core.
// Mouse: arrasta o card inteiro (move 6px para começar, então o clique continua funcionando).
// Toque: segura 200ms para arrastar (assim a rolagem horizontal das colunas continua livre).
// Teclado: foco na alça (ícone de pontos), Espaço pega o card, setas movem, Espaço solta, Esc cancela.
import * as React from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

/** Coluna sob o ponteiro (mouse e toque); no teclado, que não tem ponteiro, vale a que mais se sobrepõe ao card. */
const deteccao: CollisionDetection = (args) => {
  const sobPonteiro = pointerWithin(args)
  return sobPonteiro.length > 0 ? sobPonteiro : rectIntersection(args)
}

export interface ContextoKanbanProps {
  /** Chamado ao soltar um card sobre uma coluna (a tela decide se é uma mudança de verdade). */
  aoMover: (idItem: string, idColuna: string) => void
  /** Aparência do card enquanto é arrastado. */
  sobreposicao: (idItem: string) => React.ReactNode
  children: React.ReactNode
}

export function ContextoKanban({ aoMover, sobreposicao, children }: ContextoKanbanProps) {
  const [ativo, setAtivo] = React.useState<string | null>(null)
  // Id fixo: sem ele o dnd-kit gera ids diferentes no servidor e no navegador (aviso de hidratação)
  const idContexto = React.useId()
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const aoSoltar = (e: DragEndEvent) => {
    setAtivo(null)
    if (e.over) aoMover(String(e.active.id), String(e.over.id))
  }

  return (
    <DndContext
      sensors={sensores}
      id={idContexto}
      collisionDetection={deteccao}
      onDragStart={(e: DragStartEvent) => setAtivo(String(e.active.id))}
      onDragEnd={aoSoltar}
      onDragCancel={() => setAtivo(null)}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {ativo ? <div className="cursor-grabbing rounded-lg shadow-xl ring-2 ring-primary/60">{sobreposicao(ativo)}</div> : null}
      </DragOverlay>
    </DndContext>
  )
}

/** Coluna que recebe cards; ganha um contorno verde quando há um card por cima. */
export function ColunaSoltavel({ id, className, children, ...props }: React.ComponentProps<"section"> & { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <section ref={setNodeRef} {...props} className={cn(className, "transition-shadow", isOver && "ring-2 ring-primary/70")}>
      {children}
    </section>
  )
}

/** Card que pode ser arrastado; `rotulo` descreve o card para leitores de tela. */
export function CartaoArrastavel({
  id,
  rotulo,
  className,
  children,
}: {
  id: string
  rotulo: string
  className?: string
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({ id })
  return (
    <li
      ref={setNodeRef}
      {...listeners}
      className={cn("relative cursor-grab touch-manipulation", className, isDragging && "opacity-30")}
    >
      {/* Alça: é ela que recebe o foco do teclado; o resto do card continua com seus links e botões */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        aria-label={`Mover ${rotulo}`}
        className="absolute top-1.5 right-1.5 rounded p-0.5 text-muted-foreground/60 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      {children}
    </li>
  )
}
