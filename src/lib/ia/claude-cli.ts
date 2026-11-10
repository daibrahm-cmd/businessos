// Chamada ao Claude pelo CLI local (`claude -p`), sem chave de API. Roda só no servidor.
// Sem ferramentas: o modelo só lê o contexto (stdin) e escreve a resposta.
import { spawn } from "node:child_process"
import type { ProvedorIA } from "@/lib/ia/provedor"

const TEMPO_LIMITE_PADRAO_MS = 4 * 60 * 1000

/** Manda `contexto` pelo stdin e devolve o texto respondido, seguindo as `instrucoes` de sistema. */
export function chamarClaude(
  contexto: string,
  instrucoes: string,
  tempoLimiteMs: number = TEMPO_LIMITE_PADRAO_MS,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const filho = spawn(
      "claude",
      ["-p", "--no-session-persistence", "--tools", "", "--append-system-prompt", instrucoes],
      { stdio: ["pipe", "pipe", "pipe"] },
    )
    let saida = ""
    let erro = ""
    const timer = setTimeout(() => {
      filho.kill("SIGTERM")
      reject(new Error(`O Claude demorou demais para responder (${Math.round(tempoLimiteMs / 60000)} min). Tente de novo.`))
    }, tempoLimiteMs)

    filho.stdout.on("data", (d: Buffer) => (saida += d.toString()))
    filho.stderr.on("data", (d: Buffer) => (erro += d.toString()))
    filho.on("error", (e: NodeJS.ErrnoException) => {
      clearTimeout(timer)
      reject(
        new Error(
          e.code === "ENOENT"
            ? "Não encontrei o comando `claude`. Instale o Claude Code e faça login (claude auth login)."
            : `Falha ao iniciar o Claude: ${e.message}`,
        ),
      )
    })
    filho.on("close", (codigo) => {
      clearTimeout(timer)
      if (codigo === 0 && saida.trim()) resolve(saida.trim())
      else reject(new Error(`O Claude terminou com erro (código ${codigo}). ${erro.trim().slice(0, 300)}`))
    })
    filho.stdin.end(contexto)
  })
}

/** O CLI como implementação do contrato `ProvedorIA` (maxTokens não se aplica aqui). */
export const provedorCli: ProvedorIA = {
  gerar: (contexto, instrucoes, opcoes) => chamarClaude(contexto, instrucoes, opcoes?.tempoLimiteMs),
}
