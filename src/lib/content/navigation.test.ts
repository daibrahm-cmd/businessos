// Testes da navegação (fonte única de ids).
import { describe, expect, it } from "vitest";
import { DOC_IDS, NAVEGACAO, ehIdValido, montarId } from "@/lib/content/navigation";

describe("navegação", () => {
  it("tem os 13 ids na ordem da sidebar", () => {
    expect(DOC_IDS).toEqual([
      "founder/objetivo",
      "founder/estilo-de-vida",
      "direcao/mapa-de-mercado",
      "direcao/ima-de-problemas",
      "direcao/perfil-de-cliente-ideal",
      "direcao/tese-de-valor",
      "direcao/oferta",
      "validacao/oferta",
      "validacao/leads",
      "validacao/primeiros-clientes",
      "validacao/fluxo-de-caixa",
      "caixa/fluxo-de-caixa",
      "caixa/erp",
    ]);
    expect(new Set(DOC_IDS).size).toBe(DOC_IDS.length);
  });

  it.each([
    "../x",
    "founder/../caixa/erp",
    "founder/objetivo.md",
    "FOUNDER/objetivo",
    "founder%2Fobjetivo",
    "",
    null,
    undefined,
    42,
  ])("ehIdValido recusa %s", (valor) => {
    expect(ehIdValido(valor)).toBe(false);
  });

  it("ehIdValido aceita ids da navegação", () => {
    for (const id of DOC_IDS) expect(ehIdValido(id)).toBe(true);
  });

  it("montarId valida os segmentos", () => {
    expect(montarId("direcao", "oferta")).toBe("direcao/oferta");
    expect(montarId("direcao", "xyz")).toBeNull();
    expect(montarId("..", "oferta")).toBeNull();
  });

  it("nenhuma seção se chama api (conflitaria com /api)", () => {
    expect(NAVEGACAO.map((s) => s.slug)).not.toContain("api");
  });
});
