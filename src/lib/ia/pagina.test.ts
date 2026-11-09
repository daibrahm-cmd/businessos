// Testes das partes puras da IA por página: extração do JSON e filtro das sugestões.
import { describe, expect, it } from "vitest"
import { obterDefinicao } from "@/lib/content/schemas"
import { extrairJson, validarSugestoes } from "@/lib/ia/pagina"

describe("extrairJson", () => {
  it("aceita JSON cercado por texto e por ```", () => {
    expect(extrairJson('Claro!\n```json\n{"campos":{"a":1}}\n```')).toEqual({ campos: { a: 1 } })
  })
  it("sem JSON lança erro legível", () => {
    expect(() => extrairJson("não sei")).toThrow(/JSON válido/)
    expect(() => extrairJson("{ quebrado")).toThrow(/JSON válido/)
  })
})

describe("validarSugestoes", () => {
  const def = obterDefinicao("founder/estilo-de-vida")
  const texto = def.campos.find((c) => c.tipo === "texto-curto" || c.tipo === "texto-longo")!
  const numero = def.campos.find((c) => c.tipo === "numero")!

  it("aceita campo vazio válido, descarta inexistente, preenchido e inválido", () => {
    const r = validarSugestoes(
      def,
      { campos: { [texto.nome]: "texto sugerido", [numero.nome]: "não é número", inventado: "x" } },
      {},
    )
    expect(r).toEqual({ [texto.nome]: "texto sugerido" })

    const preenchido = validarSugestoes(def, { campos: { [texto.nome]: "novo" } }, { [texto.nome]: "meu texto" })
    expect(preenchido).toEqual({})
  })

  it("formato inesperado vira vazio", () => {
    expect(validarSugestoes(def, null, {})).toEqual({})
    expect(validarSugestoes(def, { campos: 5 }, {})).toEqual({})
  })
})
