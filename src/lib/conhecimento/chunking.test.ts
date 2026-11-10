import { describe, expect, it } from "vitest"
import { dividirEmTrechos } from "@/lib/conhecimento/chunking"

describe("dividirEmTrechos", () => {
  it("texto curto vira um único trecho", () => {
    expect(dividirEmTrechos("Olá\n\nmundo")).toEqual(["Olá\n\nmundo"])
  })

  it("texto vazio não gera trechos", () => {
    expect(dividirEmTrechos("  \n\n ")).toEqual([])
  })

  it("agrupa parágrafos sem passar do limite e repete o final do anterior no próximo", () => {
    const paragrafos = Array.from({ length: 6 }, (_, i) => `Parágrafo ${i} ${"x".repeat(300)}`)
    const trechos = dividirEmTrechos(paragrafos.join("\n\n"), { tamanho: 800, sobreposicao: 100 })
    expect(trechos.length).toBeGreaterThan(1)
    for (const t of trechos) expect(t.length).toBeLessThanOrEqual(800)
    // sobreposição: o fim do trecho anterior reaparece no começo do seguinte
    const fimDoPrimeiro = trechos[0].slice(-30)
    expect(trechos[1]).toContain(fimDoPrimeiro)
    // nenhum parágrafo se perde
    for (const p of paragrafos) expect(trechos.some((t) => t.includes(p))).toBe(true)
  })

  it("parágrafo gigante é quebrado em pedaços dentro do limite", () => {
    const longo = Array.from({ length: 400 }, (_, i) => `palavra${i}`).join(" ")
    const trechos = dividirEmTrechos(longo, { tamanho: 800, sobreposicao: 0 })
    expect(trechos.length).toBeGreaterThan(2)
    for (const t of trechos) expect(t.length).toBeLessThanOrEqual(800)
    expect(trechos.join(" ")).toBe(longo)
  })

  it("é determinístico (mesma entrada, mesmos trechos)", () => {
    const texto = Array.from({ length: 10 }, (_, i) => `P${i} ${"y".repeat(250)}`).join("\n\n")
    expect(dividirEmTrechos(texto)).toEqual(dividirEmTrechos(texto))
  })
})
