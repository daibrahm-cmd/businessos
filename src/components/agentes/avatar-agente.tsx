// Avatar redondo com um robozinho em SVG. Cada agente tem o seu (cor, cabeça, olhos, boca e antena);
// agentes sem receita cadastrada ganham um robô determinístico a partir do nome.
import { cn } from "@/lib/utils"

type Antena = "bola" | "dupla" | "raio" | "nenhuma"
type Cabeca = "quadrada" | "redonda" | "larga" | "octogono"
type Olhos = "pontos" | "visor" | "ciclope" | "sonolento" | "feliz" | "quadrados"
type Boca = "sorriso" | "grade" | "reta" | "aberta"

interface Receita {
  cor: string
  antena: Antena
  cabeca: Cabeca
  olhos: Olhos
  boca: Boca
  orelhas: boolean
}

const CORES = [
  "#C8F04D", "#5FD1C0", "#7FB4F5", "#B8A1F2", "#F29DC0", "#F4907A",
  "#F2C15B", "#8FE3A3", "#D9C7A0", "#B0C2C2", "#6FE0E8", "#F5B58A",
] as const
const ANTENAS: Antena[] = ["bola", "dupla", "raio", "nenhuma"]
const CABECAS: Cabeca[] = ["quadrada", "redonda", "larga", "octogono"]
const OLHOS: Olhos[] = ["pontos", "visor", "ciclope", "sonolento", "feliz", "quadrados"]
const BOCAS: Boca[] = ["sorriso", "grade", "reta", "aberta"]

/** Robôs dos agentes atuais: todos diferentes entre si (cor + combinação de traços). */
const RECEITAS: Record<string, Receita> = {
  founder: { cor: CORES[0], antena: "bola", cabeca: "quadrada", olhos: "pontos", boca: "sorriso", orelhas: true },
  "mapa-de-mercado": { cor: CORES[2], antena: "dupla", cabeca: "larga", olhos: "visor", boca: "reta", orelhas: false },
  "ima-de-problemas": { cor: CORES[5], antena: "raio", cabeca: "octogono", olhos: "ciclope", boca: "grade", orelhas: true },
  "perfil-de-cliente-ideal": { cor: CORES[4], antena: "bola", cabeca: "redonda", olhos: "feliz", boca: "sorriso", orelhas: false },
  "tese-de-valor": { cor: CORES[3], antena: "nenhuma", cabeca: "quadrada", olhos: "quadrados", boca: "reta", orelhas: true },
  oferta: { cor: CORES[6], antena: "dupla", cabeca: "redonda", olhos: "pontos", boca: "aberta", orelhas: true },
  validacao: { cor: CORES[7], antena: "raio", cabeca: "larga", olhos: "feliz", boca: "grade", orelhas: false },
  "fluxo-de-caixa": { cor: CORES[1], antena: "bola", cabeca: "octogono", olhos: "visor", boca: "sorriso", orelhas: true },
  erp: { cor: CORES[8], antena: "nenhuma", cabeca: "larga", olhos: "quadrados", boca: "grade", orelhas: true },
  "assistente-de-arranque": { cor: CORES[10], antena: "bola", cabeca: "redonda", olhos: "ciclope", boca: "aberta", orelhas: false },
  resumo: { cor: CORES[9], antena: "dupla", cabeca: "quadrada", olhos: "sonolento", boca: "reta", orelhas: false },
  "revisor-de-contexto": { cor: CORES[11], antena: "raio", cabeca: "octogono", olhos: "pontos", boca: "sorriso", orelhas: true },
}

/** Hash simples e estável do nome (para agentes novos). */
function hash(texto: string): number {
  let h = 2166136261
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

function receitaDe(nome: string): Receita {
  const conhecida = RECEITAS[nome]
  if (conhecida) return conhecida
  const h = hash(nome)
  return {
    cor: CORES[h % CORES.length],
    antena: ANTENAS[(h >> 3) % ANTENAS.length],
    cabeca: CABECAS[(h >> 5) % CABECAS.length],
    olhos: OLHOS[(h >> 7) % OLHOS.length],
    boca: BOCAS[(h >> 9) % BOCAS.length],
    orelhas: ((h >> 11) & 1) === 1,
  }
}

const ESCURO = "#0F1717"
const LUZ = "#EAF7F1"

function Antena({ tipo, cor }: { tipo: Antena; cor: string }) {
  switch (tipo) {
    case "bola":
      return (
        <>
          <line x1="32" y1="19" x2="32" y2="12" stroke={cor} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="32" cy="10" r="3.2" fill={cor} />
        </>
      )
    case "dupla":
      return (
        <>
          <line x1="25" y1="19" x2="22" y2="11" stroke={cor} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="39" y1="19" x2="42" y2="11" stroke={cor} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="22" cy="10" r="2.4" fill={cor} />
          <circle cx="42" cy="10" r="2.4" fill={cor} />
        </>
      )
    case "raio":
      return <polyline points="32,19 29,14 34,12 31,6" fill="none" stroke={cor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    default:
      return null
  }
}

function Cabeca({ tipo, cor }: { tipo: Cabeca; cor: string }) {
  switch (tipo) {
    case "redonda":
      return <rect x="15" y="19" width="34" height="30" rx="15" fill={cor} />
    case "larga":
      return <rect x="11" y="20" width="42" height="28" rx="7" fill={cor} />
    case "octogono":
      return <polygon points="22,19 42,19 50,27 50,41 42,49 22,49 14,41 14,27" fill={cor} />
    default:
      return <rect x="15" y="19" width="34" height="30" rx="8" fill={cor} />
  }
}

function Olhos({ tipo }: { tipo: Olhos }) {
  switch (tipo) {
    case "visor":
      return <rect x="21" y="29" width="22" height="5" rx="2.5" fill={LUZ} />
    case "ciclope":
      return <circle cx="32" cy="31.5" r="4.6" fill={LUZ} />
    case "sonolento":
      return (
        <g stroke={LUZ} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M23 32 h7" />
          <path d="M34 32 h7" />
        </g>
      )
    case "feliz":
      return (
        <g stroke={LUZ} strokeWidth="2.2" strokeLinecap="round" fill="none">
          <path d="M23 33 q3.5 -5 7 0" />
          <path d="M34 33 q3.5 -5 7 0" />
        </g>
      )
    case "quadrados":
      return (
        <g fill={LUZ}>
          <rect x="22.5" y="28.5" width="6" height="6" rx="1.2" />
          <rect x="35.5" y="28.5" width="6" height="6" rx="1.2" />
        </g>
      )
    default:
      return (
        <g fill={LUZ}>
          <circle cx="26.5" cy="31.5" r="2.9" />
          <circle cx="37.5" cy="31.5" r="2.9" />
        </g>
      )
  }
}

function Boca({ tipo }: { tipo: Boca }) {
  switch (tipo) {
    case "grade":
      return (
        <g stroke={ESCURO} strokeWidth="1.8" strokeLinecap="round">
          <path d="M26 42.5 v3" />
          <path d="M30 42.5 v3" />
          <path d="M34 42.5 v3" />
          <path d="M38 42.5 v3" />
        </g>
      )
    case "reta":
      return <path d="M27 44 h10" stroke={ESCURO} strokeWidth="2" strokeLinecap="round" />
    case "aberta":
      return <ellipse cx="32" cy="44" rx="3.4" ry="2.4" fill={ESCURO} />
    default:
      return <path d="M26.5 42.5 q5.5 5 11 0" stroke={ESCURO} strokeWidth="2" strokeLinecap="round" fill="none" />
  }
}

export interface AvatarAgenteProps {
  /** Nome técnico do agente (nome do arquivo em agents/). */
  nome: string
  /** Lado em px (círculo). */
  tamanho?: number
  className?: string
}

export function AvatarAgente({ nome, tamanho = 40, className }: AvatarAgenteProps) {
  const r = receitaDe(nome)
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 overflow-hidden rounded-full ring-1 ring-foreground/15", className)}
      style={{ width: tamanho, height: tamanho, backgroundColor: `${r.cor}2E` }}
    >
      <svg viewBox="0 0 64 64" width="100%" height="100%" role="presentation">
        <Antena tipo={r.antena} cor={r.cor} />
        {r.orelhas && (
          <g fill={r.cor}>
            <rect x="8" y="29" width="5" height="11" rx="2" />
            <rect x="51" y="29" width="5" height="11" rx="2" />
          </g>
        )}
        {/* corpo (cortado pelo círculo) */}
        <rect x="19" y="52" width="26" height="14" rx="6" fill={r.cor} opacity="0.85" />
        <rect x="28" y="48" width="8" height="5" fill={r.cor} opacity="0.7" />
        <Cabeca tipo={r.cabeca} cor={r.cor} />
        {/* visor escuro onde ficam os olhos */}
        <rect x="19" y="25" width="26" height="13" rx="5" fill={ESCURO} />
        <Olhos tipo={r.olhos} />
        <Boca tipo={r.boca} />
      </svg>
    </span>
  )
}
