"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Provedor de tema (claro/escuro) baseado em next-themes.
// A configuração padrão do app (dark por padrão, classe no <html>) fica no root layout.
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
