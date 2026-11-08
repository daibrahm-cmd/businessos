"use client"

// Sidebar do BusinessOS: marca, selo do estágio, seções e páginas da navegação (fonte única).
// No mobile vira um sheet (comportamento do shadcn) que fecha ao navegar.
import Link from "next/link"
import { usePathname } from "next/navigation"
import { House } from "lucide-react"

import { ROTULOS_STATUS } from "@/components/cards/status-badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { hrefDoDocumento, NAVEGACAO, type DocId } from "@/lib/content/navigation"
import type { Status } from "@/lib/content/types"
import { cn } from "@/lib/utils"

import { ICONES } from "./icones"
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

  // No mobile, navegar fecha o sheet
  const aoNavegar = () => {
    if (isMobile) setOpenMobile(false)
  }

  // Alvo de toque ≥ 44 px no mobile; compacto no desktop
  const classeBotao = "h-11 md:h-8"

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="gap-3 px-4 pt-5 pb-2">
        <Link
          href="/"
          onClick={aoNavegar}
          className="w-fit rounded-md text-base font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-sidebar-ring"
        >
          BusinessOS
        </Link>
        <StageBadge className="h-6 px-2.5" />
      </SidebarHeader>

      <SidebarContent className="gap-1 pb-2">
        {NAVEGACAO.map((secao) => (
          <SidebarGroup key={secao.slug} className="px-2 py-1.5">
            <SidebarGroupLabel className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {secao.titulo}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {secao.paginas.map((pagina) => {
                  const id = `${secao.slug}/${pagina.slug}` as DocId
                  const href = hrefDoDocumento(id)
                  const Icone = ICONES[pagina.icone]
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
                          <Icone />
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/"} className={classeBotao}>
              <Link href="/" onClick={aoNavegar} aria-current={pathname === "/" ? "page" : undefined}>
                <House />
                <span>Início</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
