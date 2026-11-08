// 404 dentro do shell (com sidebar): usado pelo notFound() das rotas de seção e de página.
import type { Metadata } from "next"

import { AppHeader } from "@/components/layout/app-header"

import { AvisoNaoEncontrado } from "./_componentes/aviso-nao-encontrado"

export const metadata: Metadata = { title: "Página não encontrada" }

export default function NaoEncontradoNoShell() {
  return (
    <>
      <AppHeader trilha={[{ rotulo: "Início", href: "/" }, { rotulo: "Página não encontrada" }]} />
      <AvisoNaoEncontrado />
    </>
  )
}
