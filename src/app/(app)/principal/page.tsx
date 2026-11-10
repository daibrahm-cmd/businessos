// Principal: tela inicial do chat com a IA (prompt grande + atalhos sugeridos).
import type { Metadata } from "next"

import { BotaoConversas } from "@/components/chat/botao-conversas"
import { Chat } from "@/components/chat/chat"
import { AppHeader } from "@/components/layout/app-header"

export const metadata: Metadata = { title: "Principal" }

export default function PrincipalPage() {
  return (
    <>
      <AppHeader trilha={[{ rotulo: "Principal" }]} acoes={<BotaoConversas />} />
      <Chat />
    </>
  )
}
