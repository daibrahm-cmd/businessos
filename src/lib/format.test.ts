// Testes da formatação pt-BR.
import { describe, expect, it } from "vitest";
import {
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarNumero,
  parsearNumeroBR,
} from "@/lib/format";

describe("formatarMoeda", () => {
  it("formata em reais com separadores pt-BR", () => {
    expect(formatarMoeda(1500.5)).toBe("R$ 1.500,50");
    expect(formatarMoeda(0)).toBe("R$ 0,00");
    expect(formatarMoeda(-89)).toBe("-R$ 89,00");
  });
});

describe("formatarNumero", () => {
  it("usa unidade com espaço, exceto %", () => {
    expect(formatarNumero(1234.5)).toBe("1.234,5");
    expect(formatarNumero(25, "h")).toBe("25 h");
    expect(formatarNumero(12, "%")).toBe("12%");
  });
});

describe("formatarData", () => {
  it("formata por partes, sem deslocamento de fuso", () => {
    expect(formatarData("2026-11-08")).toBe("08/11/2026");
    expect(formatarData("2026-01-01")).toBe("01/01/2026");
  });
  it("devolve a entrada se não for AAAA-MM-DD", () => {
    expect(formatarData("ontem")).toBe("ontem");
  });
});

describe("formatarDataHora", () => {
  it("exibe no horário de São Paulo", () => {
    expect(formatarDataHora("2026-11-08T14:32:10.000Z")).toBe("08/11/2026 às 11:32");
    expect(formatarDataHora("2026-01-01T02:00:00.000Z")).toBe("31/12/2025 às 23:00");
  });
});

describe("parsearNumeroBR", () => {
  it.each([
    ["1.500,50", 1500.5],
    ["1500.5", 1500.5],
    ["R$ 1.500,50", 1500.5],
    ["  42 ", 42],
    ["-3,5", -3.5],
    ["0", 0],
  ])("%s → %s", (texto, esperado) => {
    expect(parsearNumeroBR(texto)).toBe(esperado);
  });
  it("vazio → null", () => {
    expect(parsearNumeroBR("")).toBeNull();
    expect(parsearNumeroBR("   ")).toBeNull();
  });
  it("inválido → undefined", () => {
    expect(parsearNumeroBR("abc")).toBeUndefined();
    expect(parsearNumeroBR("1,2,3")).toBeUndefined();
    expect(parsearNumeroBR("12a")).toBeUndefined();
  });
});
