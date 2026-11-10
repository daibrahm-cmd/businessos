import { describe, expect, it } from "vitest"

import { criarParserNdjson, ehEventoChat, lerEventosChat } from "./ndjson"

const conversa = { tipo: "conversa", conversa: { id: "c1", titulo: "Oi", atualizadoEm: "2026-11-10T12:00:00.000Z" } }
const texto = { tipo: "texto", delta: "olá" }
const linha = (o: unknown) => JSON.stringify(o) + "\n"

describe("criarParserNdjson", () => {
  it("lê várias linhas de um mesmo chunk", () => {
    const parser = criarParserNdjson()
    expect(parser.alimentar(linha(conversa) + linha(texto))).toEqual([conversa, texto])
  })

  it("junta uma linha cortada entre dois chunks", () => {
    const parser = criarParserNdjson()
    const completa = linha(texto)
    expect(parser.alimentar(completa.slice(0, 8))).toEqual([])
    expect(parser.alimentar(completa.slice(8))).toEqual([texto])
  })

  it("ignora linhas vazias, JSON inválido e eventos desconhecidos", () => {
    const parser = criarParserNdjson()
    const eventos = parser.alimentar(`\n{quebrado\n${linha({ tipo: "outro" })}${linha(texto)}`)
    expect(eventos).toEqual([texto])
  })

  it("finalizar aproveita a última linha sem quebra", () => {
    const parser = criarParserNdjson()
    expect(parser.alimentar(JSON.stringify(texto))).toEqual([])
    expect(parser.finalizar()).toEqual([texto])
    expect(parser.finalizar()).toEqual([])
  })
})

describe("ehEventoChat", () => {
  it("valida o formato de cada tipo", () => {
    expect(ehEventoChat({ tipo: "erro", mensagem: "x" })).toBe(true)
    expect(ehEventoChat({ tipo: "erro" })).toBe(false)
    expect(ehEventoChat({ tipo: "texto", delta: 1 })).toBe(false)
    expect(ehEventoChat(null)).toBe(false)
  })
})

describe("lerEventosChat", () => {
  it("decodifica acentos mesmo quando o chunk corta o caractere no meio", async () => {
    const bytes = new TextEncoder().encode(linha({ tipo: "texto", delta: "ação" }))
    const corte = bytes.indexOf(0xc3) + 1 // no meio do "ç"
    const corpo = new ReadableStream<Uint8Array>({
      start(controlador) {
        controlador.enqueue(bytes.slice(0, corte))
        controlador.enqueue(bytes.slice(corte))
        controlador.close()
      },
    })
    const eventos = []
    for await (const e of lerEventosChat(corpo)) eventos.push(e)
    expect(eventos).toEqual([{ tipo: "texto", delta: "ação" }])
  })
})
