import { describe, expect, it } from "vitest"

import type { Mensagem } from "@/lib/conversas/tipos"

import { ESTADO_INICIAL, estadoDaConversa, reducerChat, type EstadoChat } from "./mensagens-reducer"

const AGORA = "2026-11-10T12:00:00.000Z"

const resposta: Mensagem = {
  id: "m2",
  conversaId: "c1",
  papel: "assistente",
  conteudo: "Resposta final",
  fontes: [{ origemTipo: "documento", origemId: "founder/objetivo", titulo: "Objetivo" }],
  criadoEm: AGORA,
}

function enviar(estado: EstadoChat = ESTADO_INICIAL, pergunta = "Oi") {
  return reducerChat(estado, { tipo: "enviar", pergunta, idTemporario: "tmp-1", agora: AGORA })
}

describe("reducerChat", () => {
  it("enviar adiciona a pergunta otimista e entra em 'aguardando'", () => {
    const estado = enviar()
    expect(estado.status).toBe("aguardando")
    expect(estado.mensagens).toHaveLength(1)
    expect(estado.mensagens[0]).toMatchObject({ id: "tmp-1", papel: "usuario", conteudo: "Oi", conversaId: "" })
    expect(estado.ultimaPergunta).toBe("Oi")
  })

  it("evento conversa define o id e vincula a pergunta otimista", () => {
    const estado = reducerChat(enviar(), {
      tipo: "evento",
      evento: { tipo: "conversa", conversa: { id: "c1", titulo: "Oi", atualizadoEm: AGORA } },
    })
    expect(estado.conversaId).toBe("c1")
    expect(estado.mensagens[0].conversaId).toBe("c1")
  })

  it("evento texto acumula os deltas e passa para 'transmitindo'", () => {
    let estado = enviar()
    estado = reducerChat(estado, { tipo: "evento", evento: { tipo: "texto", delta: "Olá, " } })
    estado = reducerChat(estado, { tipo: "evento", evento: { tipo: "texto", delta: "mundo" } })
    expect(estado.textoParcial).toBe("Olá, mundo")
    expect(estado.status).toBe("transmitindo")
  })

  it("evento fim troca o texto parcial pela mensagem salva", () => {
    let estado = enviar()
    estado = reducerChat(estado, { tipo: "evento", evento: { tipo: "texto", delta: "Resp" } })
    estado = reducerChat(estado, { tipo: "evento", evento: { tipo: "fim", mensagem: resposta } })
    expect(estado.textoParcial).toBe("")
    expect(estado.status).toBe("ocioso")
    expect(estado.mensagens.at(-1)).toEqual(resposta)
  })

  it("evento erro guarda a mensagem e volta a ocioso", () => {
    const estado = reducerChat(enviar(), { tipo: "evento", evento: { tipo: "erro", mensagem: "Falhou" } })
    expect(estado.erro).toBe("Falhou")
    expect(estado.status).toBe("ocioso")
  })

  it("enviar de novo limpa o erro anterior", () => {
    const comErro = reducerChat(enviar(), { tipo: "falha", mensagem: "Sem rede" })
    expect(enviar(comErro, "Outra").erro).toBeNull()
  })

  it("interromper mantém o texto parcial como resposta", () => {
    let estado = enviar()
    estado = reducerChat(estado, { tipo: "evento", evento: { tipo: "texto", delta: "Meio" } })
    estado = reducerChat(estado, { tipo: "interromper", idTemporario: "tmp-2", agora: AGORA })
    expect(estado.status).toBe("ocioso")
    expect(estado.mensagens.at(-1)).toMatchObject({ papel: "assistente", conteudo: "Meio" })
  })

  it("interromper sem texto não cria mensagem vazia", () => {
    const estado = reducerChat(enviar(), { tipo: "interromper", idTemporario: "tmp-2", agora: AGORA })
    expect(estado.mensagens).toHaveLength(1)
  })

  it("descartar-ultima-pergunta remove só a pergunta do usuário que falhou", () => {
    const falhou = reducerChat(enviar(), { tipo: "falha", mensagem: "x" })
    const estado = reducerChat(falhou, { tipo: "descartar-ultima-pergunta" })
    expect(estado.mensagens).toHaveLength(0)
    expect(estado.erro).toBeNull()

    const base = estadoDaConversa({ id: "c1", titulo: "T", atualizadoEm: AGORA, mensagens: [resposta] })
    expect(reducerChat(base, { tipo: "descartar-ultima-pergunta" }).mensagens).toHaveLength(1)
  })

  it("reiniciar volta ao estado inicial", () => {
    expect(reducerChat(enviar(), { tipo: "reiniciar" })).toEqual(ESTADO_INICIAL)
  })

  it("estadoDaConversa carrega id e mensagens", () => {
    const estado = estadoDaConversa({ id: "c1", titulo: "T", atualizadoEm: AGORA, mensagens: [resposta] })
    expect(estado.conversaId).toBe("c1")
    expect(estado.mensagens).toEqual([resposta])
    expect(estadoDaConversa()).toEqual(ESTADO_INICIAL)
  })
})
