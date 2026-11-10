// Testes da lógica pura de validação, sanitização e caminho.
import { describe, expect, it } from "vitest";
import { LIMITE_BYTES } from "@/lib/arquivos/tipos";
import { ErroArquivo, gerarCaminho, sanitizarNome, validarArquivo } from "@/lib/arquivos/validar";

const codigo = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e instanceof ErroArquivo ? e.codigo : "OUTRO";
  }
  return null;
};

describe("sanitizarNome", () => {
  it("remove acentos e troca espaços por hífen", () => {
    expect(sanitizarNome("Relatório Final São Paulo.PDF")).toBe("Relatorio-Final-Sao-Paulo.pdf");
  });
  it("bloqueia path traversal", () => {
    expect(sanitizarNome("../../etc/passwd.txt")).toBe("passwd.txt");
    expect(sanitizarNome("..\\..\\x.png")).toBe("x.png");
    expect(codigo(() => sanitizarNome("..."))).toBe("NOME_INVALIDO");
    expect(codigo(() => sanitizarNome("/"))).toBe("NOME_INVALIDO");
  });
  it("limita o tamanho do nome", () => {
    expect(sanitizarNome("a".repeat(300) + ".png").length).toBeLessThanOrEqual(84);
  });
});

describe("validarArquivo", () => {
  it("aceita arquivo válido", () => {
    const r = validarArquivo({ name: "Foto Ñ.JPEG", type: "image/jpeg", size: 10 });
    expect(r).toEqual({ mime: "image/jpeg", nomeSanitizado: "Foto-N.jpeg", tamanho: 10 });
  });
  it("rejeita vazio, grande e tipo desconhecido", () => {
    expect(codigo(() => validarArquivo({ name: "a.png", type: "image/png", size: 0 }))).toBe("VAZIO");
    expect(codigo(() => validarArquivo({ name: "a.png", type: "image/png", size: LIMITE_BYTES + 1 }))).toBe(
      "TAMANHO_EXCEDIDO",
    );
    expect(codigo(() => validarArquivo({ name: "a.exe", type: "application/x-msdownload", size: 1 }))).toBe(
      "TIPO_NAO_PERMITIDO",
    );
    expect(codigo(() => validarArquivo({ name: "a.png", type: "toString", size: 1 }))).toBe("TIPO_NAO_PERMITIDO");
  });
  it("aceita exatamente o limite", () => {
    expect(validarArquivo({ name: "a.pdf", type: "application/pdf", size: LIMITE_BYTES }).mime).toBe("application/pdf");
  });
  it("rejeita extensão que não bate com o mime", () => {
    expect(codigo(() => validarArquivo({ name: "a.exe", type: "image/png", size: 1 }))).toBe("EXTENSAO_INVALIDA");
    expect(codigo(() => validarArquivo({ name: "semextensao", type: "image/png", size: 1 }))).toBe(
      "EXTENSAO_INVALIDA",
    );
  });
});

describe("gerarCaminho", () => {
  it("usa <userId>/<uuid>-<nome>", () => {
    expect(gerarCaminho("u1", "a.png", "uuid-1")).toBe("u1/uuid-1-a.png");
  });
  it("rejeita userId com barra", () => {
    expect(codigo(() => gerarCaminho("a/b", "x.png"))).toBe("NOME_INVALIDO");
  });
});
