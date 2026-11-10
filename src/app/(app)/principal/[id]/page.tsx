// Conversa salva: carrega as mensagens no servidor e entrega ao chat (que continua de onde parou).
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BotaoConversas } from "@/components/chat/botao-conversas"
import { Chat } from "@/components/chat/chat"
import { AppHeader } from "@/components/layout/app-header"
import { obterConversaAction } from "@/lib/conversas/actions"

export const metadata: Metadata = { title: "Conversa" }

export default async function ConversaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const resultado = await obterConversaAction(id).catch(() => ({
    ok: false as const,
    mensagem: "Não foi possível abrir a conversa agora.",
  }))

  if (!resultado.ok) {
    // "não encontrada" vira 404 amigável; qualquer outra falha aparece como aviso na própria tela
    if (/n[ãa]o encontrad/i.test(resultado.mensagem)) notFound()
    return (
      <>
        <AppHeader trilha={[{ rotulo: "Principal", href: "/principal" }, { rotulo: "Conversa" }]} acoes={<BotaoConversas />} />
        <p role="alert" className="m-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          {resultado.mensagem}
        </p>
      </>
    )
  }

  const { conversa } = resultado
  return (
    <>
      <AppHeader
        trilha={[{ rotulo: "Principal", href: "/principal" }, { rotulo: conversa.titulo }]}
        acoes={<BotaoConversas />}
      />
      {/* key: trocar de conversa remonta o chat com o estado da nova */}
      <Chat key={conversa.id} conversaInicial={conversa} />
    </>
  )
}
