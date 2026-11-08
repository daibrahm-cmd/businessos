"use client"

import * as React from "react"

import type { ModoVisualizacao } from "@/lib/content/types"

// Preferência "Grade / Lista" de cada coleção de cards, guardada no localStorage.
// Chave: businessos:modo:<chave>. Toda leitura/gravação é protegida por try/catch
// (modo privado, storage cheio ou bloqueado) e falha em silêncio (RF-21).

const PREFIXO = "businessos:modo:"

// Ouvintes por chave: componentes com a mesma chave ficam sincronizados na mesma aba
const ouvintes = new Map<string, Set<() => void>>()

function ehModo(valor: unknown): valor is ModoVisualizacao {
  return valor === "grade" || valor === "lista"
}

function lerPreferencia(chave: string): ModoVisualizacao | null {
  try {
    const valor = window.localStorage.getItem(PREFIXO + chave)
    return ehModo(valor) ? valor : null
  } catch {
    return null
  }
}

function gravarPreferencia(chave: string, modo: ModoVisualizacao) {
  try {
    window.localStorage.setItem(PREFIXO + chave, modo)
  } catch {
    // Sem armazenamento disponível: a escolha vale só nesta sessão da tela.
  }
}

function avisar(chave: string) {
  ouvintes.get(chave)?.forEach((ouvinte) => ouvinte())
}

/**
 * Modo de visualização persistido por chave.
 *
 * Usa useSyncExternalStore: no servidor e na hidratação o valor é sempre `padrao`
 * (sem erro de hidratação); logo depois o React troca para o valor salvo, se houver.
 */
export function useModoVisualizacao(
  chave: string,
  padrao: ModoVisualizacao = "grade",
): [ModoVisualizacao, (m: ModoVisualizacao) => void] {
  // Valor escolhido nesta sessão quando o storage falha (fallback em memória)
  const [emMemoria, setEmMemoria] = React.useState<ModoVisualizacao | null>(null)

  const subscribe = React.useCallback(
    (callback: () => void) => {
      let conjunto = ouvintes.get(chave)
      if (!conjunto) {
        conjunto = new Set()
        ouvintes.set(chave, conjunto)
      }
      conjunto.add(callback)

      // Outras abas: o evento "storage" avisa quando a mesma chave muda
      const aoMudarStorage = (evento: StorageEvent) => {
        if (evento.key === PREFIXO + chave) callback()
      }
      window.addEventListener("storage", aoMudarStorage)

      return () => {
        conjunto?.delete(callback)
        window.removeEventListener("storage", aoMudarStorage)
      }
    },
    [chave],
  )

  const salvo = React.useSyncExternalStore(
    subscribe,
    () => lerPreferencia(chave),
    () => null,
  )

  const modo = salvo ?? emMemoria ?? padrao

  const definirModo = React.useCallback(
    (novo: ModoVisualizacao) => {
      if (!ehModo(novo)) return
      setEmMemoria(novo)
      gravarPreferencia(chave, novo)
      avisar(chave)
    },
    [chave],
  )

  return [modo, definirModo]
}
