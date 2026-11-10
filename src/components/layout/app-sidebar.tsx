"use client"

// Sidebar do BusinessOS: marca, selo do estágio, seções e páginas da navegação (fonte única).
// No mobile vira um sheet (comportamento do shadcn) que fecha ao navegar.
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Bot,
  ChevronRight,
  Compass,
  FileText,
  FlaskConical,
  Footprints,
  House,
  LogOut,
  Sparkles,
  Target,
  UserRound,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react"

import { sair } from "@/app/(auth)/acoes"
import { ROTULOS_STATUS } from "@/components/cards/status-badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { hrefDaSecao, hrefDoDocumento, NAVEGACAO, type DocId, type SecaoSlug } from "@/lib/content/navigation"
import type { Status } from "@/lib/content/types"
import { cn } from "@/lib/utils"

import { MarcaDB } from "./marca-db"
import { StageBadge } from "./stage-badge"

interface ItemMenu {
  href: string
  rotulo: string
  icone: LucideIcon
  /** Página de conteúdo (mostra o pontinho de status). */
  id?: DocId
}

/** Principal: o chat com a IA (ativo em /principal e /principal/[id]). */
const ITENS_PRINCIPAL: readonly ItemMenu[] = [{ href: "/principal", rotulo: "Principal", icone: Sparkles }]

/** Geral: telas fora das seções. */
const ITENS_GERAL: readonly ItemMenu[] = [
  { href: "/", rotulo: "Início", icone: House },
  { href: "/comecar", rotulo: "Passo a passo", icone: Footprints },
  { href: "/briefing", rotulo: "Briefing", icone: FileText },
]

/** Ícone de cada seção do negócio. */
const ICONE_DA_SECAO: Record<string, LucideIcon> = {
  founder: UserRound,
  direcao: Compass,
  validacao: FlaskConical,
  caixa: Wallet,
}

/** Sistema: o que roda por trás e a página Leads, na ordem: Leads, Oportunidades, Workflow, Agentes. */
const ITENS_SISTEMA: readonly ItemMenu[] = [
  {
    href: hrefDoDocumento("validacao/leads"),
    rotulo: "Leads",
    icone: Users,
    id: "validacao/leads",
  },
  { href: "/oportunidades", rotulo: "Oportunidades", icone: Target },
  { href: "/workflow", rotulo: "Workflow", icone: Workflow },
  { href: "/agentes", rotulo: "Agentes", icone: Bot },
]

export interface UsuarioSidebar {
  nome: string
  email: string
  papel: "admin" | "usuario"
}

export interface AppSidebarProps {
  /** Usuário logado (nome, e-mail e botão Sair no rodapé). Ausente = sem rodapé. */
  usuario?: UsuarioSidebar
  /** Status de cada página (pontinho à direita). Ausente = sem indicador. */
  statusPorId?: Partial<Record<DocId, Status>>
}

/** Ponto de status: vazio sem ponto; rascunho/em validação contorno; validado preenchido. */
function PontoStatus({ status }: { status?: Status }) {
  if (!status) return null
  return (
    <span className="ml-auto flex shrink-0 items-center pl-2">
      {status !== "vazio" && (
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", status === "validado" ? "bg-foreground" : "border border-foreground/70")}
        />
      )}
      <span className="sr-only">{ROTULOS_STATUS[status]}</span>
    </span>
  )
}

/** Um grupo de itens planos: etiqueta pequena + ícone e nome de cada item, sem acordeão. */
function Grupo({
  titulo,
  itens,
  ativo,
  aoNavegar,
  statusPorId,
  recolhivel,
}: {
  recolhivel?: { aberto: boolean; alternar: () => void }
  /** Sem título, o grupo é só a lista de itens (usado pelo item Principal, no topo). */
  titulo?: string
  itens: readonly ItemMenu[]
  ativo: (i: ItemMenu) => boolean
  aoNavegar: () => void
  statusPorId?: AppSidebarProps["statusPorId"]
}) {
  // Alvo de toque ≥ 44 px no mobile; compacto no desktop. Item ativo: pílula Marinho (claro) ou Grisalho (escuro).
  const classeBotao =
    "h-11 gap-2.5 text-[11.5px] md:h-8 data-active:bg-[#3F495A] data-active:text-[#EFEFEF] dark:data-active:bg-[#B0C2C2] dark:data-active:text-[#373634]"
  return (
    <SidebarGroup className={cn("px-2 py-0", !titulo && "pt-1")}>
      {!titulo ? null : recolhivel ? (
        // Grupo recolhível: o título é um botão que abre/fecha a lista
        <button
          type="button"
          onClick={recolhivel.alternar}
          aria-expanded={recolhivel.aberto}
          className="flex w-full items-center justify-between rounded-md px-4 pt-3 pb-0.5 text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring"
        >
          {titulo}
          <ChevronRight aria-hidden className={cn("size-3 transition-transform", recolhivel.aberto && "rotate-90")} />
        </button>
      ) : (
        <p className="px-4 pt-3 pb-0.5 text-sm font-medium tracking-[0.14em] text-muted-foreground uppercase">{titulo}</p>
      )}
      <SidebarGroupContent hidden={recolhivel ? !recolhivel.aberto : false}>
        <SidebarMenu>
          {itens.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={ativo(item)} className={classeBotao}>
                <Link href={item.href} onClick={aoNavegar} aria-current={ativo(item) ? "page" : undefined}>
                  <item.icone aria-hidden className="size-3.5 shrink-0" />
                  <span className="truncate">{item.rotulo}</span>
                  {item.id && <PontoStatus status={statusPorId?.[item.id]} />}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar({ statusPorId, usuario }: AppSidebarProps) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  // No mobile, navegar fecha o sheet
  const aoNavegar = () => {
    if (isMobile) setOpenMobile(false)
  }

  // Seções: Founder, Direção, Validação e Caixa. Cada uma abre a capa com as páginas dentro dela.
  const itensSecoes: ItemMenu[] = NAVEGACAO.map((secao) => ({
    href: hrefDaSecao(secao.slug as SecaoSlug),
    rotulo: secao.nome,
    icone: ICONE_DA_SECAO[secao.slug] ?? FlaskConical,
  }))
  // A seção fica ativa em qualquer página dela, menos na Leads (que é do grupo Sistema)
  const noSistema = ITENS_SISTEMA.some((i) => i.href === pathname)
  const secaoAtiva = (i: ItemMenu) => !noSistema && (pathname === i.href || pathname.startsWith(`${i.href}/`))

  // Seções e Sistema recolhem ao clicar no título; abrem sozinhos quando a página atual está dentro deles.
  // Sem escolha manual (null) vale o estado automático — derivado no render, sem useEffect.
  const [manual, setManual] = useState<{ geral: boolean | null; secoes: boolean | null; sistema: boolean | null }>({
    geral: null,
    secoes: null,
    sistema: null,
  })
  // Geral abre por padrão (é o ponto de partida); as outras seguem a página atual
  const geralAberto = manual.geral ?? true
  const secoesAbertas = manual.secoes ?? itensSecoes.some(secaoAtiva)
  const sistemaAberto = manual.sistema ?? noSistema

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="gap-3 px-4 pt-5 pb-2">
        <Link
          href="/"
          onClick={aoNavegar}
          className="flex w-fit items-center gap-2.5 rounded-md text-base font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-sidebar-ring"
        >
          <MarcaDB className="h-6 w-auto text-sidebar-primary" />
          BusinessOS
        </Link>
        <StageBadge className="h-6 px-2.5" />
      </SidebarHeader>

      <SidebarContent className="gap-1 pb-2">
        <Grupo
          itens={ITENS_PRINCIPAL}
          ativo={(i) => pathname === i.href || pathname.startsWith(`${i.href}/`)}
          aoNavegar={aoNavegar}
        />
        <Grupo
          titulo="Geral"
          itens={ITENS_GERAL}
          ativo={(i) => pathname === i.href}
          aoNavegar={aoNavegar}
          recolhivel={{ aberto: geralAberto, alternar: () => setManual((m) => ({ ...m, geral: !geralAberto })) }}
        />
        <Grupo
          titulo="Seções"
          itens={itensSecoes}
          ativo={secaoAtiva}
          aoNavegar={aoNavegar}
          recolhivel={{
            aberto: secoesAbertas,
            alternar: () => setManual((m) => ({ ...m, secoes: !secoesAbertas })),
          }}
        />
        <Grupo
          titulo="Sistema"
          itens={ITENS_SISTEMA}
          ativo={(i) => pathname === i.href}
          aoNavegar={aoNavegar}
          statusPorId={statusPorId}
          recolhivel={{
            aberto: sistemaAberto,
            alternar: () => setManual((m) => ({ ...m, sistema: !sistemaAberto })),
          }}
        />
      </SidebarContent>

      {usuario && (
        <SidebarFooter className="gap-2 border-t border-sidebar-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-medium">{usuario.nome}</p>
            <p className="truncate text-[10.5px] text-muted-foreground">
              {usuario.email}
              {usuario.papel === "admin" && " · admin"}
            </p>
          </div>
          {/* Server Action: encerra a sessão e volta para /login */}
          <form action={sair}>
            <button
              type="submit"
              className="flex h-11 w-full items-center gap-2.5 rounded-md px-2 text-[11.5px] text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring md:h-8"
            >
              <LogOut aria-hidden className="size-3.5 shrink-0" />
              Sair
            </button>
          </form>
        </SidebarFooter>
      )}

      <SidebarRail />
    </Sidebar>
  )
}
