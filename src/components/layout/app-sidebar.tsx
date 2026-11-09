"use client"

// Sidebar do BusinessOS: marca, selo do estágio, seções e páginas da navegação (fonte única).
// No mobile vira um sheet (comportamento do shadcn) que fecha ao navegar.
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { ROTULOS_STATUS } from "@/components/cards/status-badge"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { ehSecaoValida, hrefDaSecao, hrefDoDocumento, NAVEGACAO, type DocId, type SecaoSlug } from "@/lib/content/navigation"
import type { Status } from "@/lib/content/types"
import { cn } from "@/lib/utils"

import { MarcaDB } from "./marca-db"
import { StageBadge } from "./stage-badge"

export interface AppSidebarProps {
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
          className={cn(
            "size-1.5 rounded-full",
            status === "validado" ? "bg-foreground" : "border border-foreground/70",
          )}
        />
      )}
      <span className="sr-only">{ROTULOS_STATUS[status]}</span>
    </span>
  )
}

export function AppSidebar({ statusPorId }: AppSidebarProps) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  // As 4 seções ficam sempre visíveis; só as páginas abrem/fecham (uma seção por vez), no desktop e no mobile.
  // Começa aberta a seção da página atual.
  // Telas fora das seções: Início, Passo a passo e Briefing → grupo "geral"; Workflow e Agentes → grupo "sistema".
  const primeiroSegmento = pathname.split("/")[1] ?? ""
  const secaoAtual = ehSecaoValida(primeiroSegmento)
    ? primeiroSegmento
    : primeiroSegmento === "workflow" || primeiroSegmento === "agentes"
      ? "sistema"
      : "geral"
  const [secaoAberta, setSecaoAberta] = useState<string | null>(secaoAtual)

  // No mobile, navegar fecha o sheet
  const aoNavegar = () => {
    if (isMobile) setOpenMobile(false)
  }

  // Alvo de toque ≥ 44 px no mobile; compacto no desktop. Itens das seções: fonte ~30% menor (14 → 10 px), sem ícones.
  const classeBotao = "h-11 text-[11.5px] md:h-8 data-active:bg-[#3F495A] data-active:text-[#EFEFEF] dark:data-active:bg-[#B0C2C2] dark:data-active:text-[#373634]"

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
        {/* Geral: Início primeiro, depois as telas fora das seções; abre/fecha como as demais */}
        <SidebarGroup className="px-2 py-1.5">
          <button
            type="button"
            aria-expanded={secaoAberta === "geral"}
            onClick={() => setSecaoAberta(secaoAberta === "geral" ? null : "geral")}
            className="flex h-11 w-full items-center justify-between rounded-md px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring md:h-8"
          >
            GERAL
            <ChevronDown
              aria-hidden
              className={cn("size-4 transition-transform", secaoAberta === "geral" && "rotate-180")}
            />
          </button>
          <SidebarGroupContent className={cn(secaoAberta !== "geral" && "hidden")}>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} className={classeBotao}>
                  <Link href="/" onClick={aoNavegar} aria-current={pathname === "/" ? "page" : undefined}>
                    <span>Início</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/comecar"} className={classeBotao}>
                  <Link
                    href="/comecar"
                    onClick={aoNavegar}
                    aria-current={pathname === "/comecar" ? "page" : undefined}
                  >
                    <span>Passo a passo</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/oportunidades"} className={classeBotao}>
                  <Link
                    href="/oportunidades"
                    onClick={aoNavegar}
                    aria-current={pathname === "/oportunidades" ? "page" : undefined}
                  >
                    <span>Oportunidades</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/briefing"} className={classeBotao}>
                  <Link
                    href="/briefing"
                    onClick={aoNavegar}
                    aria-current={pathname === "/briefing" ? "page" : undefined}
                  >
                    <span>Briefing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {NAVEGACAO.map((secao) => (
          <SidebarGroup key={secao.slug} className="px-2 py-1.5">
            {/* Cabeçalho da seção: o nome abre a capa (cards-resumo) e expande as páginas; a seta só expande/recolhe */}
            <div className="flex items-center">
              <Link
                href={hrefDaSecao(secao.slug as SecaoSlug)}
                onClick={() => {
                  setSecaoAberta(secao.slug)
                  aoNavegar()
                }}
                aria-current={pathname === hrefDaSecao(secao.slug as SecaoSlug) ? "page" : undefined}
                className={cn(
                  "flex h-11 min-w-0 flex-1 items-center rounded-md px-2 text-xs font-medium tracking-wider uppercase outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring md:h-8",
                  pathname === hrefDaSecao(secao.slug as SecaoSlug)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground",
                )}
              >
                {secao.titulo}
              </Link>
              <button
                type="button"
                aria-expanded={secaoAberta === secao.slug}
                aria-label={`${secaoAberta === secao.slug ? "Recolher" : "Expandir"} ${secao.nome}`}
                onClick={() => setSecaoAberta(secaoAberta === secao.slug ? null : secao.slug)}
                className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring md:size-8"
              >
                <ChevronDown
                  aria-hidden
                  className={cn("size-4 transition-transform", secaoAberta === secao.slug && "rotate-180")}
                />
              </button>
            </div>
            <SidebarGroupContent className={cn(secaoAberta !== secao.slug && "hidden")}>
              <SidebarMenu>
                {secao.paginas.map((pagina) => {
                  const id = `${secao.slug}/${pagina.slug}` as DocId
                  const href = hrefDoDocumento(id)
                  return (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === href}
                        className={classeBotao}
                      >
                        <Link
                          href={href}
                          onClick={aoNavegar}
                          aria-current={pathname === href ? "page" : undefined}
                        >
                          <span className="truncate">{pagina.titulo}</span>
                          <PontoStatus status={statusPorId?.[id]} />
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {/* Sistema: o que roda por trás (agentes e fila de trabalho); abre/fecha como as demais */}
        <SidebarGroup className="px-2 py-1.5">
          <button
            type="button"
            aria-expanded={secaoAberta === "sistema"}
            onClick={() => setSecaoAberta(secaoAberta === "sistema" ? null : "sistema")}
            className="flex h-11 w-full items-center justify-between rounded-md px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-sidebar-ring md:h-8"
          >
            SISTEMA
            <ChevronDown
              aria-hidden
              className={cn("size-4 transition-transform", secaoAberta === "sistema" && "rotate-180")}
            />
          </button>
          <SidebarGroupContent className={cn(secaoAberta !== "sistema" && "hidden")}>
            <SidebarMenu>
              {[
                { href: "/workflow", rotulo: "Workflow" },
                { href: "/agentes", rotulo: "Agentes" },
              ].map(({ href, rotulo }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={pathname === href} className={classeBotao}>
                    <Link href={href} onClick={aoNavegar} aria-current={pathname === href ? "page" : undefined}>
                      <span>{rotulo}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>


      <SidebarRail />
    </Sidebar>
  )
}
