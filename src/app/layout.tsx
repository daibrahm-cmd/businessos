import type { Metadata } from "next"
import { Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

// IBM Plex Mono (identidade visual DB) exposta como variável CSS --font-plex,
// consumida por --font-sans/--font-mono/--font-heading no @theme do globals.css.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

// Cormorant Garamond (identidade DB): só nos títulos de página, via classe font-display. Uso moderado.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: { default: "BusinessOS", template: "%s · BusinessOS" },
  description: "Inteligência do negócio para quem está começando.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: next-themes altera a classe do <html> antes da hidratação.
    // A variável da fonte fica no <html> para que portais (dialog, sheet, tooltip) também herdem a fonte.
    <html
      lang="pt-BR"
      className={`${plexMono.variable} ${cormorant.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className={`${plexMono.variable} ${cormorant.variable} flex min-h-full flex-col font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
