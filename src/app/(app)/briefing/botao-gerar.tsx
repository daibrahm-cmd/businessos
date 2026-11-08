"use client"

// Botão "Gerar briefing": chama a action, mostra o carregamento (leva ~1 min) e avisa erros.
import * as React from "react"
import { Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { gerarBriefingAction } from "./actions"

export function BotaoGerar({ temBriefing }: { temBriefing: boolean }) {
  const router = useRouter()
  const [pendente, iniciar] = React.useTransition()

  const gerar = () =>
    iniciar(async () => {
      const r = await gerarBriefingAction()
      if (r.ok) {
        toast.success("Briefing gerado.")
        router.refresh()
      } else {
        toast.error(r.mensagem)
      }
    })

  return (
    <Button onClick={gerar} disabled={pendente} className="h-11 md:h-9">
      <Sparkles aria-hidden />
      {pendente ? "Gerando… (cerca de 1 minuto)" : temBriefing ? "Gerar de novo" : "Gerar briefing"}
    </Button>
  )
}
