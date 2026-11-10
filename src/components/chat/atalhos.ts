// Atalhos sugeridos da página Principal: preenchem o prompt (não enviam sozinhos).
import { CircleHelp, Footprints, ListTree, type LucideIcon } from "lucide-react"

export interface Atalho {
  rotulo: string
  /** Texto que vai para o prompt. */
  prompt: string
  icone: LucideIcon
}

export const ATALHOS: readonly Atalho[] = [
  {
    rotulo: "Resumir meu contexto",
    prompt: "Resuma o meu contexto de negócio em poucos parágrafos, página por página.",
    icone: ListTree,
  },
  {
    rotulo: "Apontar lacunas",
    prompt: "Quais lacunas e pontos vazios você enxerga no meu contexto hoje?",
    icone: CircleHelp,
  },
  {
    rotulo: "Sugerir o próximo passo",
    prompt: "Com base no que já está preenchido, qual deveria ser o meu próximo passo?",
    icone: Footprints,
  },
]
