// 404 global (sem sidebar): URLs que não casam com nenhuma rota, ex.: /a/b/c.
import type { Metadata } from "next"

import { AvisoNaoEncontrado } from "./(app)/_componentes/aviso-nao-encontrado"

export const metadata: Metadata = { title: "Página não encontrada" }

export default function NaoEncontrado() {
  return (
    <main className="flex flex-1 flex-col">
      <AvisoNaoEncontrado />
    </main>
  )
}
