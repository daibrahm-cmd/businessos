// 404 amigável de uma conversa que não existe (ou foi excluída).
import Link from "next/link"
import { MessageSquareOff } from "lucide-react"

import { BotaoConversas } from "@/components/chat/botao-conversas"
import { AppHeader } from "@/components/layout/app-header"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ConversaNaoEncontrada() {
  return (
    <>
      <AppHeader
        trilha={[{ rotulo: "Principal", href: "/principal" }, { rotulo: "Conversa não encontrada" }]}
        acoes={<BotaoConversas />}
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <MessageSquareOff aria-hidden className="size-8 text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Conversa não encontrada</h1>
          <p className="text-sm text-muted-foreground">Ela pode ter sido excluída ou o link está incorreto.</p>
        </div>
        <Link href="/principal" className={cn(buttonVariants(), "h-11 md:h-8")}>
          Começar uma nova conversa
        </Link>
      </div>
    </>
  )
}
