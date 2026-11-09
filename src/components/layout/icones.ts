// Mapa NomeIcone (navegação, dados puros) → componente de ícone do lucide-react.
import {
  ContactRound,
  FlaskConical,
  Lightbulb,
  Magnet,
  Map as MapIcon,
  Package,
  PiggyBank,
  Sun,
  Target,
  UserRound,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react"

import type { NomeIcone } from "@/lib/content/navigation"

export const ICONES: Record<NomeIcone, LucideIcon> = {
  target: Target,
  sun: Sun,
  map: MapIcon,
  magnet: Magnet,
  "user-round": UserRound,
  lightbulb: Lightbulb,
  package: Package,
  "flask-conical": FlaskConical,
  users: Users,
  "piggy-bank": PiggyBank,
  wallet: Wallet,
  workflow: Workflow,
  "contact-round": ContactRound,
}
