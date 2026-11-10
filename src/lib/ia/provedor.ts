// Contrato único de IA do BusinessOS. Roda só no servidor.
// Implementações: API HTTP da Anthropic (`api`), CLI local do Claude (`cli`) ou nenhuma (`desligada`).
import { criarProvedorApi } from "@/lib/ia/claude-api"
import { provedorCli } from "@/lib/ia/claude-cli"

export interface OpcoesIA {
  /** Tempo máximo de espera, em ms. Cada provedor tem seu padrão. */
  tempoLimiteMs?: number
  /** Limite de tokens da resposta (só vale para o provedor `api`). */
  maxTokens?: number
}

export interface ProvedorIA {
  gerar(contexto: string, instrucoes: string, opcoes?: OpcoesIA): Promise<string>
}

export type ModoIA = "api" | "cli" | "desligada"

/** Decide o modo: BUSINESSOS_IA explícito vence; senão `api` se houver chave, senão `cli` (comportamento anterior). */
export function resolverModoIA(env: NodeJS.ProcessEnv = process.env): ModoIA {
  const pedido = env.BUSINESSOS_IA?.trim().toLowerCase()
  if (pedido === "api" || pedido === "cli" || pedido === "desligada") return pedido
  return env.ANTHROPIC_API_KEY?.trim() ? "api" : "cli"
}

const provedorDesligado: ProvedorIA = {
  async gerar() {
    throw new Error("A IA está desligada (BUSINESSOS_IA=desligada). Defina BUSINESSOS_IA=api ou cli no .env.local para usá-la.")
  },
}

export function obterProvedorIA(env: NodeJS.ProcessEnv = process.env): ProvedorIA {
  const modo = resolverModoIA(env)
  if (modo === "api") return criarProvedorApi({ env })
  if (modo === "cli") return provedorCli
  return provedorDesligado
}
