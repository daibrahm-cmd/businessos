import { describe, expect, it } from "vitest"

import { digitosDoWhatsapp, erroDoCampo, mascararWhatsapp, onboardingSchema } from "@/lib/onboarding/schemas"

describe("whatsapp", () => {
  it("aceita celular com máscara e guarda em formato internacional", () => {
    const r = onboardingSchema.shape.whatsapp.safeParse("(11) 99999-8888")
    expect(r.success && r.data).toBe("+5511999998888")
  })

  it("aceita o número com +55 e fixo com DDD", () => {
    expect(onboardingSchema.shape.whatsapp.safeParse("+55 51 3333-4444")).toMatchObject({ success: true, data: "+555133334444" })
  })

  it("recusa número curto, sem DDD ou com DDD inválido", () => {
    expect(erroDoCampo("whatsapp", "99999-8888")).toMatch(/DDD/)
    expect(erroDoCampo("whatsapp", "(00) 99999-8888")).toMatch(/DDD/)
    expect(erroDoCampo("whatsapp", "(11) 89999-8888")).toMatch(/DDD/) // celular precisa começar com 9
    expect(erroDoCampo("whatsapp", "")).toMatch(/DDD/)
  })

  it("tira o 55 só quando ele é do país, não um DDD", () => {
    expect(digitosDoWhatsapp("5511999998888")).toBe("11999998888")
    expect(digitosDoWhatsapp("55999998888")).toBe("55999998888") // DDD 55 (RS), 11 dígitos
  })

  it("monta a máscara enquanto a pessoa digita", () => {
    expect(mascararWhatsapp("1")).toBe("1")
    expect(mascararWhatsapp("119")).toBe("(11) 9")
    expect(mascararWhatsapp("1199999")).toBe("(11) 9999-9")
    expect(mascararWhatsapp("11999998888")).toBe("(11) 99999-8888")
    expect(mascararWhatsapp("1133334444")).toBe("(11) 3333-4444")
    expect(mascararWhatsapp("11999998888999")).toBe("(11) 99999-8888") // corta o excesso
  })
})

describe("demais perguntas", () => {
  it("nome: exige pelo menos 2 letras e limita o tamanho", () => {
    expect(erroDoCampo("nome", " ")).toBeTruthy()
    expect(erroDoCampo("nome", "A")).toBeTruthy()
    expect(erroDoCampo("nome", "Ana")).toBeNull()
    expect(erroDoCampo("nome", "x".repeat(81))).toBeTruthy()
  })

  it("e-mail: valida o formato", () => {
    expect(erroDoCampo("email", "sem-arroba")).toMatch(/válido/)
    expect(erroDoCampo("email", "ana@empresa.com.br")).toBeNull()
  })

  it("empresa: obrigatória", () => {
    expect(erroDoCampo("empresa", "   ")).toBeTruthy()
    expect(erroDoCampo("empresa", "Marca Viva")).toBeNull()
  })

  it("funcionários: só as faixas oferecidas", () => {
    expect(erroDoCampo("funcionarios", "")).toBeTruthy()
    expect(erroDoCampo("funcionarios", "1000000")).toBeTruthy()
    expect(erroDoCampo("funcionarios", "11-50")).toBeNull()
  })
})

describe("onboardingSchema completo", () => {
  it("normaliza e-mail e WhatsApp", () => {
    const r = onboardingSchema.parse({
      nome: " Ana ",
      email: " ANA@Empresa.com ",
      whatsapp: "11 99999-8888",
      empresa: "Marca Viva",
      funcionarios: "2-10",
    })
    expect(r).toEqual({ nome: "Ana", email: "ana@empresa.com", whatsapp: "+5511999998888", empresa: "Marca Viva", funcionarios: "2-10" })
  })

  it("recusa quando falta uma resposta", () => {
    expect(onboardingSchema.safeParse({ nome: "Ana" }).success).toBe(false)
  })
})
