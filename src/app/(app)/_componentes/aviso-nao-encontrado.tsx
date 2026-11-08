// Conteúdo do 404, compartilhado pelo 404 dentro do shell e pelo 404 global (sem sidebar).
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function AvisoNaoEncontrado() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 px-4 py-6 md:px-8 md:py-8">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Erro 404</p>
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground">Este endereço não existe no BusinessOS.</p>
      <Button asChild className="min-h-11 md:min-h-9">
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  )
}
