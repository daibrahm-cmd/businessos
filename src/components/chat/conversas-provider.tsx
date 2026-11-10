"use client"

// Estado compartilhado da lista de conversas (segunda sidebar) e do painel no mobile.
// Fica no layout de /principal, então sobrevive à troca entre /principal e /principal/[id].
import * as React from "react"

import type { ResumoConversa } from "@/lib/conversas/tipos"

interface ContextoConversas {
  /** Mais recente primeiro. */
  conversas: ResumoConversa[]
  /** Falha ao carregar a lista no servidor (mostrada no painel). */
  erro: string | null
  /** Cria a conversa na lista ou atualiza título/data de uma existente. */
  registrar: (conversa: ResumoConversa) => void
  /** Só atualiza a data (resposta nova) e reordena. */
  tocar: (id: string, atualizadoEm: string) => void
  renomear: (id: string, titulo: string) => void
  remover: (id: string) => void
  painelAberto: boolean
  definirPainelAberto: (aberto: boolean) => void
}

const Contexto = React.createContext<ContextoConversas | null>(null)

export function useConversas(): ContextoConversas {
  const ctx = React.useContext(Contexto)
  if (!ctx) throw new Error("useConversas precisa estar dentro de <ConversasProvider>")
  return ctx
}

/** Ordena do mais recente para o mais antigo (ISO compara como texto). */
export function ordenarConversas(lista: ResumoConversa[]): ResumoConversa[] {
  return [...lista].sort((a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : a.atualizadoEm > b.atualizadoEm ? -1 : 0))
}

export interface ConversasProviderProps {
  conversasIniciais: ResumoConversa[]
  erroInicial?: string | null
  children: React.ReactNode
}

export function ConversasProvider({ conversasIniciais, erroInicial = null, children }: ConversasProviderProps) {
  const [conversas, setConversas] = React.useState(() => ordenarConversas(conversasIniciais))
  const [painelAberto, definirPainelAberto] = React.useState(false)

  // Se o servidor entregar uma lista nova (router.refresh), ela substitui a local
  const [anteriores, setAnteriores] = React.useState(conversasIniciais)
  if (anteriores !== conversasIniciais) {
    setAnteriores(conversasIniciais)
    setConversas(ordenarConversas(conversasIniciais))
  }

  const registrar = React.useCallback((conversa: ResumoConversa) => {
    setConversas((atual) => ordenarConversas([conversa, ...atual.filter((c) => c.id !== conversa.id)]))
  }, [])

  const tocar = React.useCallback((id: string, atualizadoEm: string) => {
    setConversas((atual) => ordenarConversas(atual.map((c) => (c.id === id ? { ...c, atualizadoEm } : c))))
  }, [])

  const renomear = React.useCallback((id: string, titulo: string) => {
    setConversas((atual) => atual.map((c) => (c.id === id ? { ...c, titulo } : c)))
  }, [])

  const remover = React.useCallback((id: string) => {
    setConversas((atual) => atual.filter((c) => c.id !== id))
  }, [])

  const valor = React.useMemo(
    () => ({ conversas, erro: erroInicial, registrar, tocar, renomear, remover, painelAberto, definirPainelAberto }),
    [conversas, erroInicial, registrar, tocar, renomear, remover, painelAberto],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
