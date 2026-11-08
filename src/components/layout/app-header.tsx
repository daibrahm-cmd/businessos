"use client"

// Barra superior do shell: abre a sidebar, mostra a trilha (breadcrumb) e o seletor de tema.
import * as React from "react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { ThemeToggle } from "./theme-toggle"

export interface ItemTrilha {
  rotulo: string
  href?: string
}

export interface AppHeaderProps {
  trilha: ItemTrilha[]
}

export function AppHeader({ trilha }: AppHeaderProps) {
  const ultimo = trilha.length - 1

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger aria-label="Abrir menu" className="-ml-1 size-11 md:size-7" />
      <Separator orientation="vertical" className="mr-1 h-4! self-center!" />

      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap">
          {trilha.map((item, i) => {
            const ehUltimo = i === ultimo
            return (
              <React.Fragment key={`${item.rotulo}-${i}`}>
                {/* No mobile só o último item aparece; os anteriores voltam a partir de md */}
                <BreadcrumbItem className={cn("min-w-0", !ehUltimo && "hidden md:inline-flex")}>
                  {ehUltimo || !item.href ? (
                    <BreadcrumbPage className="truncate">{item.rotulo}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.rotulo}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!ehUltimo && <BreadcrumbSeparator className="hidden md:block" />}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <ThemeToggle className="-mr-1" />
    </header>
  )
}
