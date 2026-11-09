import type { Preview } from "@storybook/nextjs-vite"
import { withThemeByClassName } from "@storybook/addon-themes"
import { Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google"

import { TooltipProvider } from "../src/components/ui/tooltip"
import { Toaster } from "../src/components/ui/sonner"

// Mesmos estilos globais do app (Tailwind v4 + tokens do shadcn)
import "../src/app/globals.css"

// Mesma fonte do root layout, exposta como --font-plex (consumida por --font-sans no globals.css)
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

// Aplica a variável da fonte no <html> para que portais (dialog, sheet, tooltip) também herdem a fonte
if (typeof document !== "undefined") {
  document.documentElement.classList.add(plexMono.variable, cormorant.variable, "font-sans", "antialiased")
  document.documentElement.lang = "pt-BR"
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Componentes usam next/navigation (Link, usePathname): habilita o App Router mockado
    nextjs: { appDirectory: true },
    layout: "padded",
  },
  decorators: [
    // Mesmos provedores do root layout: tooltips e toasts (sonner) funcionam nas stories
    (Story) => (
      <TooltipProvider>
        <Story />
        <Toaster position="bottom-center" />
      </TooltipProvider>
    ),
    // Alternância claro/escuro na toolbar: aplica a classe `dark` no <html> (dark é o padrão, como no app)
    withThemeByClassName({
      themes: {
        claro: "",
        escuro: "dark",
      },
      defaultTheme: "escuro",
      parentSelector: "html",
    }),
  ],
}

export default preview
