// Testes da completude de uma página.
import { describe, expect, it } from "vitest";
import { calcularCompletude } from "@/lib/content/completude";
import { obterDefinicao } from "@/lib/content/schemas";
import { criarTemplate } from "@/lib/content/schemas/build";
import { desserializar } from "@/lib/content/serializacao";
import { EXEMPLO_CLIENTES, EXEMPLO_PERFIL } from "@/lib/content/__fixtures__/exemplos";

describe("calcularCompletude", () => {
  it("template vazio → 0", () => {
    const def = obterDefinicao("caixa/erp");
    expect(calcularCompletude(criarTemplate(def), def)).toEqual({ preenchidos: 0, total: 8, percentual: 0 });
  });

  it("conta campos preenchidos (texto em branco e lista vazia não contam)", () => {
    const def = obterDefinicao("direcao/perfil-de-cliente-ideal");
    const doc = desserializar(EXEMPLO_PERFIL, def);
    expect(calcularCompletude(doc, def)).toEqual({ preenchidos: 8, total: 8, percentual: 100 });
    doc.campos.quem_e = "   ";
    doc.campos.dores = [];
    doc.campos.quanto_paga_hoje = 0; // zero é um valor
    expect(calcularCompletude(doc, def)).toEqual({ preenchidos: 6, total: 8, percentual: 75 });
  });

  it("coleção conta quando tem ao menos um item", () => {
    const def = obterDefinicao("validacao/primeiros-clientes");
    const doc = desserializar(EXEMPLO_CLIENTES, def);
    expect(calcularCompletude(doc, def)).toEqual({ preenchidos: 6, total: 6, percentual: 100 });
    doc.itens = [];
    expect(calcularCompletude(doc, def).preenchidos).toBe(5);
  });

  it("arredonda o percentual", () => {
    const def = obterDefinicao("founder/objetivo");
    const doc = criarTemplate(def);
    doc.campos.meta_12_meses = "25 clientes";
    expect(calcularCompletude(doc, def)).toEqual({ preenchidos: 1, total: 7, percentual: 14 });
  });
});
