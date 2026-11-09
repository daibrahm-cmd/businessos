"use client"

// Atualiza a página a cada poucos segundos (agentes escrevem fora do app) e mostra se está "ao vivo".
// Pausa quando a aba fica escondida, para não gastar leitura de disco à toa.
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const INTERVALO_MS = 5000

export function AtualizarAuto() {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [aoVivo, setAoVivo] = useState(true)

  useEffect(() => {
    if (!aoVivo) return
    const id = setInterval(() => {
      if (document.visibilityState === "visible") iniciar(() => router.refresh())
    }, INTERVALO_MS)
    return () => clearInterval(id)
  }, [aoVivo, router])

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={aoVivo}
        onClick={() => setAoVivo((v) => !v)}
        className="h-11 md:h-8"
      >
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", aoVivo ? "animate-pulse bg-primary" : "border border-foreground/70")}
        />
        {aoVivo ? "Ao vivo" : "Pausado"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Atualizar agora"
        onClick={() => iniciar(() => router.refresh())}
        className="size-11 md:size-8"
      >
        <RefreshCw className={cn(pendente && "animate-spin")} />
      </Button>
    </div>
  )
}
