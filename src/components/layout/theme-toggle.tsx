"use client"

// Botão que alterna entre tema escuro (padrão) e claro, via next-themes.
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// "Montado" sem setState em efeito: false no servidor/hidratação, true no cliente
const assinarNada = () => () => {}
function useMontado() {
  return React.useSyncExternalStore(
    assinarNada,
    () => true,
    () => false,
  )
}

export interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const montado = useMontado()
  const escuro = resolvedTheme !== "light"

  // Antes de montar o tema é desconhecido: renderiza o botão sem ícone (evita mismatch)
  if (!montado) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-11 md:size-8", className)}
        aria-label="Alternar tema"
        disabled
      />
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-11 md:size-8", className)}
      aria-label={escuro ? "Alternar para tema claro" : "Alternar para tema escuro"}
      onClick={() => setTheme(escuro ? "light" : "dark")}
    >
      {escuro ? <Moon /> : <Sun />}
    </Button>
  )
}
