// Parser do stream NDJSON do POST /api/chat (uma linha JSON por evento).
// Lógica pura: o chunk de rede pode cortar uma linha no meio, então guardamos o resto até chegar o "\n".
import type { EventoChat } from "@/lib/conversas/tipos"

/** Valida o formato mínimo de um evento; linhas inválidas são descartadas sem derrubar o stream. */
export function ehEventoChat(valor: unknown): valor is EventoChat {
  if (typeof valor !== "object" || valor === null) return false
  const v = valor as Record<string, unknown>
  switch (v.tipo) {
    case "conversa":
      return typeof v.conversa === "object" && v.conversa !== null && typeof (v.conversa as { id?: unknown }).id === "string"
    case "texto":
      return typeof v.delta === "string"
    case "fim":
      return typeof v.mensagem === "object" && v.mensagem !== null
    case "erro":
      return typeof v.mensagem === "string"
    default:
      return false
  }
}

function interpretarLinha(linha: string): EventoChat | null {
  const limpa = linha.trim()
  if (limpa === "") return null
  try {
    const dado: unknown = JSON.parse(limpa)
    return ehEventoChat(dado) ? dado : null
  } catch {
    return null
  }
}

/** Parser incremental: `alimentar` recebe pedaços de texto e devolve os eventos já completos. */
export function criarParserNdjson() {
  let resto = ""
  return {
    alimentar(pedaco: string): EventoChat[] {
      resto += pedaco
      const linhas = resto.split("\n")
      // A última posição é uma linha ainda incompleta (ou "" se o chunk terminou em \n)
      resto = linhas.pop() ?? ""
      const eventos: EventoChat[] = []
      for (const linha of linhas) {
        const evento = interpretarLinha(linha)
        if (evento) eventos.push(evento)
      }
      return eventos
    },
    /** Fim do stream: tenta aproveitar uma última linha sem "\n". */
    finalizar(): EventoChat[] {
      const evento = interpretarLinha(resto)
      resto = ""
      return evento ? [evento] : []
    },
  }
}

/** Lê o corpo da resposta e entrega os eventos na ordem em que chegam. */
export async function* lerEventosChat(corpo: ReadableStream<Uint8Array>): AsyncGenerator<EventoChat> {
  const leitor = corpo.getReader()
  const decodificador = new TextDecoder()
  const parser = criarParserNdjson()
  try {
    while (true) {
      const { done, value } = await leitor.read()
      if (done) break
      // stream: true evita quebrar caracteres multibyte (acentos) no limite de um chunk
      yield* parser.alimentar(decodificador.decode(value, { stream: true }))
    }
    yield* parser.alimentar(decodificador.decode())
    yield* parser.finalizar()
  } finally {
    leitor.releaseLock()
  }
}
