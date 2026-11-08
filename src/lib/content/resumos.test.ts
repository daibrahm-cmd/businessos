// Testes dos resumos de coleção e da ordenação de exibição.
import { describe, expect, it } from "vitest";
import { calcularResumos, ordenarItensParaExibicao } from "@/lib/content/resumos";
import { obterDefinicao } from "@/lib/content/schemas";
import { criarTemplate } from "@/lib/content/schemas/build";
import { desserializar } from "@/lib/content/serializacao";
import type { ContentDoc, Item } from "@/lib/content/types";
import { EXEMPLO_CLIENTES } from "@/lib/content/__fixtures__/exemplos";

const lanc = (id: string, data: string, tipo: string, valor: number | null, status: string | null): Item => ({
  id,
  colecao: "lancamentos",
  data,
  descricao: id,
  tipo,
  valor,
  categoria: null,
  recorrencia: null,
  status,
});

describe("calcularResumos", () => {
  it("contagem e soma com filtro (primeiros clientes)", () => {
    const def = obterDefinicao("validacao/primeiros-clientes");
    const doc = desserializar(EXEMPLO_CLIENTES, def);
    expect(calcularResumos(doc, def.colecoes![0])).toEqual([
      { rotulo: "Clientes fechados", valor: 1, formato: "numero" },
      { rotulo: "Receita fechada", valor: 197, formato: "moeda" },
    ]);
  });

  it("contagem sem filtro conta só itens da coleção", () => {
    const def = obterDefinicao("direcao/mapa-de-mercado");
    const doc: ContentDoc = {
      ...criarTemplate(def),
      itens: [
        { id: "s1", colecao: "segmentos", nome: "A" },
        { id: "c1", colecao: "concorrentes", nome: "B" },
        { id: "s2", colecao: "segmentos", nome: "C" },
      ],
    };
    expect(calcularResumos(doc, def.colecoes![0])).toEqual([{ rotulo: "Segmentos mapeados", valor: 2, formato: "numero" }]);
    expect(calcularResumos(doc, def.colecoes![1])).toEqual([]);
  });

  it("saldo com campoBase e filtro; soma ignora null; arredonda a 2 casas", () => {
    const def = obterDefinicao("caixa/fluxo-de-caixa");
    const doc: ContentDoc = {
      ...criarTemplate(def),
      campos: { ...criarTemplate(def).campos, saldo_inicial: 1000 },
      itens: [
        lanc("a", "2026-11-01", "entrada", 500.1, "realizado"),
        lanc("b", "2026-11-02", "saida", 200.2, "realizado"),
        lanc("c", "2026-11-03", "saida", 999, "previsto"),
        lanc("d", "2026-11-04", "saida", null, "realizado"),
      ],
    };
    expect(calcularResumos(doc, def.colecoes![0])).toEqual([
      { rotulo: "Saldo realizado", valor: 1299.9, formato: "moeda" },
      { rotulo: "Total de saídas", valor: 1199.2, formato: "moeda" },
    ]);
  });

  it("saldo sem campoBase começa do zero", () => {
    const def = obterDefinicao("validacao/fluxo-de-caixa");
    const doc: ContentDoc = {
      ...criarTemplate(def),
      itens: [
        lanc("a", "2026-11-01", "entrada", 100, null),
        lanc("b", "2026-11-02", "saida", 0.1, null),
        lanc("c", "2026-11-03", "saida", 0.2, null),
      ],
    };
    const [saldo, gasto] = calcularResumos(doc, def.colecoes![0]);
    expect(saldo).toEqual({ rotulo: "Saldo do teste", valor: 99.7, formato: "moeda" });
    // 0.1 + 0.2 em ponto flutuante = 0.30000000000000004 → arredondado a 0.3.
    expect(gasto.valor).toBe(0.3);
  });
});

describe("ordenarItensParaExibicao", () => {
  it("ordena por data desc, vazios no fim, sem alterar o array original", () => {
    const def = obterDefinicao("caixa/fluxo-de-caixa");
    const itens = [
      lanc("a", "2026-11-01", "entrada", 1, null),
      lanc("b", "", "entrada", 1, null),
      lanc("c", "2026-11-05", "entrada", 1, null),
    ];
    const copia = [...itens];
    expect(ordenarItensParaExibicao(itens, def.colecoes![0]).map((i) => i.id)).toEqual(["c", "a", "b"]);
    expect(itens).toEqual(copia);
  });

  it("sem ordenarPor mantém a ordem do arquivo", () => {
    const def = obterDefinicao("validacao/primeiros-clientes");
    const doc = desserializar(EXEMPLO_CLIENTES, def);
    expect(ordenarItensParaExibicao(doc.itens, def.colecoes![0]).map((i) => i.id)).toEqual(
      doc.itens.map((i) => i.id),
    );
  });
});
