"use client"

// Erro inesperado dentro do shell: mensagem simples e botão para tentar renderizar de novo.
import { Button } from "@/components/ui/button"

export default function ErroApp({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto flex w-full max-w-5xl flex-col items-start gap-4 px-4 py-6 md:px-8 md:py-8">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Algo deu errado.</h1>
      <p className="text-sm text-muted-foreground">Não foi possível carregar esta tela.</p>
      <Button onClick={() => reset()} className="min-h-11 md:min-h-9">
        Tentar de novo
      </Button>
    </div>
  )
}
