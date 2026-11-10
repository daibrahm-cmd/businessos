// Layout de /principal: acrescenta a segunda sidebar (conversas) ao lado da sidebar principal.
// Só existe nesta rota; as demais páginas do app não a recebem.
import { ConversasProvider } from "@/components/chat/conversas-provider"
import { PainelConversasDesktop, PainelConversasMobile } from "@/components/chat/painel-conversas"
import { listarConversasAction } from "@/lib/conversas/actions"

export const dynamic = "force-dynamic"

export default async function PrincipalLayout({ children }: { children: React.ReactNode }) {
  // Falha ao listar (banco fora do ar) não derruba o chat: o painel mostra o aviso
  const resultado = await listarConversasAction().catch(() => ({
    ok: false as const,
    mensagem: "Não foi possível carregar as conversas agora.",
  }))

  return (
    <ConversasProvider
      conversasIniciais={resultado.ok ? resultado.conversas : []}
      erroInicial={resultado.ok ? null : resultado.mensagem}
    >
      {/* h-dvh: a coluna do chat tem altura fixa; só a lista de mensagens rola e o prompt fica no rodapé */}
      <div className="flex h-dvh min-h-0 w-full">
        <PainelConversasDesktop />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
      <PainelConversasMobile />
    </ConversasProvider>
  )
}
