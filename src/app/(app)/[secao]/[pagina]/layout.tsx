// Valida o id ANTES do limite de carregamento (loading.tsx): assim um id desconhecido
// responde HTTP 404 de verdade, e não 200 com a tela de "não encontrada" após o streaming começar.
import { notFound } from "next/navigation"

import { montarId } from "@/lib/content/navigation"

export const dynamic = "force-dynamic"

export default async function LayoutPagina({ children, params }: LayoutProps<"/[secao]/[pagina]">) {
  const { secao, pagina } = await params
  if (!montarId(secao, pagina)) notFound()
  return children
}
