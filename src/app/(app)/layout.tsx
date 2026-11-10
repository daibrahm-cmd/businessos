// Shell do app: sidebar com a navegação (status de cada página) + área de conteúdo.
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { DocId } from "@/lib/content/navigation"
import { listarDocumentos } from "@/lib/content/servico"
import type { Status } from "@/lib/content/types"
import { perfilAtual } from "@/lib/supabase/perfil"

// O conteúdo muda fora do app (agentes editam os arquivos): sempre renderizar na hora.
export const dynamic = "force-dynamic"

/** Status por id para os pontinhos da sidebar. Falha de leitura não derruba o shell. */
async function carregarStatus(): Promise<Partial<Record<DocId, Status>> | undefined> {
  try {
    const documentos = await listarDocumentos()
    return Object.fromEntries(documentos.map((d) => [d.id, d.status])) as Partial<Record<DocId, Status>>
  } catch (erro) {
    console.error("[layout] não foi possível ler o status das páginas", erro)
    return undefined
  }
}

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Guarda: sem sessão válida, volta para o login (o proxy já filtra; aqui é a segunda barreira)
  const perfil = await perfilAtual()
  if (!perfil) redirect("/login")

  // Sidebar aberta por padrão; o cookie guarda a última escolha (escrito pelo SidebarProvider).
  const [armazenamento, statusPorId] = await Promise.all([cookies(), carregarStatus()])
  const defaultOpen = armazenamento.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar statusPorId={statusPorId} usuario={{ nome: perfil.nome, email: perfil.email, papel: perfil.papel }} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
