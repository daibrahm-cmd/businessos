import { describe, expect, it } from "vitest";
import { cadastrarSchema, entrarSchema, errosPorCampo } from "./schemas";

describe("entrarSchema", () => {
  it("normaliza o e-mail", () => {
    const r = entrarSchema.parse({ email: "  Ana@Exemplo.COM ", senha: "x" });
    expect(r.email).toBe("ana@exemplo.com");
  });
  it("rejeita e-mail inválido e senha vazia", () => {
    const r = entrarSchema.safeParse({ email: "ana", senha: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(errosPorCampo(r.error)).sort()).toEqual(["email", "senha"]);
  });
});

describe("cadastrarSchema", () => {
  const base = { email: "a@b.com", senha: "12345678", confirmar: "12345678" };
  it("aceita dados válidos", () => {
    expect(cadastrarSchema.safeParse(base).success).toBe(true);
  });
  it("exige senha com 8+ caracteres", () => {
    const r = cadastrarSchema.safeParse({ ...base, senha: "1234567", confirmar: "1234567" });
    expect(r.success).toBe(false);
    if (!r.success) expect(errosPorCampo(r.error).senha).toMatch(/8 caracteres/);
  });
  it("exige confirmação igual", () => {
    const r = cadastrarSchema.safeParse({ ...base, confirmar: "outra-senha" });
    expect(r.success).toBe(false);
    if (!r.success) expect(errosPorCampo(r.error).confirmar).toBe("As senhas não conferem.");
  });
});
