// Testes do leitor de notas estruturadas.
import { describe, expect, it } from "vitest";
import { analisarNotas } from "@/lib/markdown/notas";

const NOTA = `## Sugestão da founder (08/11)

Decisões da fundadora nesta conversa:

- Retirada: R$ 5.000 é o piso; R$ 12.000 é a renda desejada (meta).
- Capital: o fôlego sai dos R$ 50.000. Então sobram **R$ 30.000** para investir (o campo "Quanto pode investir" ainda mostra R$ 50.000: atualizar se concordar).
- Tempo: reduzir de 60 h para **50 h por semana** (campo atualizado).
  Cerca de 15% para prospecção deixa ~170 h/mês de entrega.

Contas para a Direção:

- 4 clientes → ~42 h por cliente/mês.
- Marcos pendentes: quantos clientes no mês 4 e no mês 6?
`;

describe("analisarNotas", () => {
  it("reconhece entrada, autor, data, grupos e rótulos", () => {
    const [e] = analisarNotas(NOTA)!;
    expect(e).toMatchObject({ titulo: "Sugestão da founder (08/11)", autor: "founder", data: "08/11" });
    expect(e.grupos.map((g) => [g.titulo, g.itens.length])).toEqual([
      ["Decisões da fundadora nesta conversa", 3],
      ["Contas para a Direção", 2],
    ]);
    expect(e.grupos[0].itens[0]).toMatchObject({ rotulo: "Retirada", alerta: false });
    expect(e.grupos[0].itens[1].texto.startsWith("O fôlego")).toBe(true); // frase sem rótulo começa em maiúscula
  });

  it("junta a linha de continuação ao item e marca alertas", () => {
    const [e] = analisarNotas(NOTA)!;
    expect(e.grupos[0].itens[2].texto).toContain("Cerca de 15%");
    expect(e.grupos[0].itens[1].alerta).toBe(true); // "atualizar"
    expect(e.grupos[1].itens[1].alerta).toBe(true); // termina em "?"
    expect(e.grupos[1].itens[0]).toMatchObject({ rotulo: null, alerta: false });
  });

  it("extrai destaques do negrito, com rótulo do item", () => {
    const [e] = analisarNotas(NOTA)!;
    expect(e.destaques.map((d) => [d.rotulo, d.valor])).toEqual([
      ["Capital", "R$ 30.000"],
      ["Tempo", "50 h por semana"],
    ]);
    expect(e.destaques[0].legenda).not.toContain("**");
  });

  it("limita a 3 destaques", () => {
    const md = "## T\n\nGrupo:\n\n- a: **1**\n- b: **2**\n- c: **3**\n- d: **4**\n";
    expect(analisarNotas(md)![0].destaques).toHaveLength(3);
  });

  it("separa várias entradas", () => {
    const md = "## Um\n\nA:\n\n- x\n\n## Dois\n\nB:\n\n- y\n";
    expect(analisarNotas(md)!.map((e) => e.titulo)).toEqual(["Um", "Dois"]);
  });

  it("texto sem lista devolve null (cai no Markdown simples)", () => {
    expect(analisarNotas("Só um parágrafo de notas.")).toBeNull();
    expect(analisarNotas("")).toBeNull();
  });
});
