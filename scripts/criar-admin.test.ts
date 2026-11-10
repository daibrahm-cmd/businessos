// Testes da lógica pura do criar-admin (cliente falso, sem rede).
import { describe, expect, it } from "vitest";
import { criarOuGarantirAdmin, validarEmail, validarSenha, type ClienteAdmin } from "./criar-admin";

function clienteFalso(existente: string | null = null) {
  const chamadas = { criar: 0, papel: [] as string[], confirmar: [] as string[] };
  const cliente: ClienteAdmin = {
    buscarUsuarioPorEmail: async () => existente,
    confirmarUsuario: async (id) => {
      chamadas.confirmar.push(id);
    },
    criarUsuario: async () => {
      chamadas.criar += 1;
      return "11111111-1111-4111-8111-111111111111";
    },
    garantirPapelAdmin: async (id) => {
      chamadas.papel.push(id);
    },
  };
  return { cliente, chamadas };
}

describe("validarSenha", () => {
  it("recusa ausente e curta, aceita 12+ caracteres", () => {
    expect(() => validarSenha(undefined)).toThrow(/ausente/);
    expect(() => validarSenha("curta123456")).toThrow(/12/);
    expect(validarSenha("123456789012")).toBe("123456789012");
  });
  it("não vaza a senha na mensagem de erro", () => {
    expect(() => validarSenha("segredo")).toThrow(expect.objectContaining({ message: expect.not.stringContaining("segredo") }));
  });
});

describe("validarEmail", () => {
  it("normaliza e valida", () => {
    expect(validarEmail("  Ana@Exemplo.COM ")).toBe("ana@exemplo.com");
    expect(() => validarEmail("sem-arroba")).toThrow();
    expect(() => validarEmail(undefined)).toThrow();
  });
});

describe("criarOuGarantirAdmin", () => {
  it("cria o usuário novo e garante o papel", async () => {
    const { cliente, chamadas } = clienteFalso();
    const r = await criarOuGarantirAdmin(cliente, "a@b.com", "senha-bem-longa");
    expect(r).toEqual({ id: "11111111-1111-4111-8111-111111111111", criado: true });
    expect(chamadas.criar).toBe(1);
    expect(chamadas.papel).toEqual([r.id]);
  });
  it("é idempotente: se já existe, confirma o e-mail e garante o papel", async () => {
    const { cliente, chamadas } = clienteFalso("22222222-2222-4222-8222-222222222222");
    const r = await criarOuGarantirAdmin(cliente, "a@b.com", "senha-bem-longa");
    expect(r.criado).toBe(false);
    expect(chamadas.criar).toBe(0);
    expect(chamadas.confirmar).toEqual(["22222222-2222-4222-8222-222222222222"]);
    expect(chamadas.papel).toEqual(["22222222-2222-4222-8222-222222222222"]);
  });
});
