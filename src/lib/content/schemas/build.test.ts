// Testes da derivação de schemas a partir da definição (§3.4).
import { describe, expect, it } from "vitest";
import {
  DATA_EPOCA,
  criarSchemaDocumento,
  criarSchemaItemCompleto,
  criarSchemaPatch,
  criarTemplate,
  ehDataReal,
  schemaEscritaDoCampo,
  schemaLeituraDoCampo,
  valorPadrao,
} from "@/lib/content/schemas/build";
import { obterDefinicao } from "@/lib/content/schemas";
import type { FieldDef } from "@/lib/content/schemas/field-types";

const curto: FieldDef = { nome: "a", rotulo: "A", tipo: "texto-curto", maxCaracteres: 5 };
const longo: FieldDef = { nome: "b", rotulo: "B", tipo: "texto-longo" };
const numero: FieldDef = { nome: "c", rotulo: "C", tipo: "numero", inteiro: true, min: 0, max: 10 };
const decimal: FieldDef = { nome: "c2", rotulo: "C2", tipo: "numero" };
const moeda: FieldDef = { nome: "d", rotulo: "D", tipo: "moeda", min: 0 };
const lista: FieldDef = { nome: "e", rotulo: "E", tipo: "lista-texto", maxItens: 2 };
const selecao: FieldDef = {
  nome: "f",
  rotulo: "F",
  tipo: "selecao",
  opcoes: [
    { valor: "x", rotulo: "X" },
    { valor: "y", rotulo: "Y" },
  ],
};
const data: FieldDef = { nome: "g", rotulo: "G", tipo: "data" };

const escrever = (c: FieldDef, v: unknown) => schemaEscritaDoCampo(c).safeParse(v);
const ler = (c: FieldDef, v: unknown) => schemaLeituraDoCampo(c).safeParse(v);

describe("valorPadrao", () => {
  it("texto → '', lista → [], demais → null", () => {
    expect(valorPadrao(curto)).toBe("");
    expect(valorPadrao(longo)).toBe("");
    expect(valorPadrao(lista)).toEqual([]);
    for (const c of [numero, moeda, selecao, data]) expect(valorPadrao(c)).toBeNull();
  });
});

describe("schemaEscritaDoCampo (estrito)", () => {
  it("texto-curto apara e respeita o limite", () => {
    expect(escrever(curto, "  abc  ").data).toBe("abc");
    expect(escrever(curto, "abcdef").success).toBe(false);
    expect(escrever(curto, 12).success).toBe(false);
    expect(escrever({ nome: "z", rotulo: "Z", tipo: "texto-curto" }, "x".repeat(201)).success).toBe(false);
  });

  it("texto-longo só apara o fim e limita a 5000", () => {
    expect(escrever(longo, "  linha 1\nlinha 2  \n").data).toBe("  linha 1\nlinha 2");
    expect(escrever(longo, "x".repeat(5001)).success).toBe(false);
  });

  it("numero aplica inteiro/min/max e recusa texto", () => {
    expect(escrever(numero, 5).data).toBe(5);
    expect(escrever(numero, 5.5).success).toBe(false);
    expect(escrever(numero, -1).success).toBe(false);
    expect(escrever(numero, 11).success).toBe(false);
    expect(escrever(numero, "5").success).toBe(false);
    expect(escrever(decimal, 2.75).data).toBe(2.75);
    expect(escrever(decimal, Infinity).success).toBe(false);
  });

  it("moeda arredonda a 2 casas e respeita min", () => {
    expect(escrever(moeda, 10.005).data).toBe(10.01);
    expect(escrever(moeda, 197.456).data).toBe(197.46);
    expect(escrever(moeda, -1).success).toBe(false);
  });

  it("lista-texto apara itens, recusa vazios e respeita o limite", () => {
    expect(escrever(lista, [" a ", "b"]).data).toEqual(["a", "b"]);
    expect(escrever(lista, ["a", ""]).success).toBe(false);
    expect(escrever(lista, ["a", "b", "c"]).success).toBe(false);
    expect(escrever(lista, ["x".repeat(301)]).success).toBe(false);
    expect(escrever(lista, "a").success).toBe(false);
  });

  it("selecao recusa opção inexistente", () => {
    expect(escrever(selecao, "x").data).toBe("x");
    expect(escrever(selecao, "z").success).toBe(false);
  });

  it("data exige AAAA-MM-DD e data real", () => {
    expect(escrever(data, "2026-02-28").data).toBe("2026-02-28");
    expect(escrever(data, "2026-02-30").success).toBe(false);
    expect(escrever(data, "08/11/2026").success).toBe(false);
    expect(ehDataReal("2024-02-29")).toBe(true);
    expect(ehDataReal("2025-02-29")).toBe(false);
  });

  it("null limpa para o valor padrão em todos os tipos", () => {
    expect(escrever(curto, null).data).toBe("");
    expect(escrever(longo, null).data).toBe("");
    expect(escrever(lista, null).data).toEqual([]);
    for (const c of [numero, moeda, selecao, data]) expect(escrever(c, null).data).toBeNull();
  });

  it("não aplica coerções de leitura", () => {
    expect(escrever(curto, undefined).success).toBe(false);
    expect(escrever(selecao, "").success).toBe(false);
    expect(escrever(data, new Date("2026-11-08T00:00:00Z")).success).toBe(false);
  });
});

describe("schemaLeituraDoCampo (tolerante)", () => {
  it("undefined → valor padrão", () => {
    expect(ler(curto, undefined).data).toBe("");
    expect(ler(lista, undefined).data).toEqual([]);
    expect(ler(moeda, undefined).data).toBeNull();
  });

  it("texto aceita número e null", () => {
    expect(ler(curto, 123).data).toBe("123");
    expect(ler(longo, null).data).toBe("");
  });

  it("numero/moeda aceitam string numérica", () => {
    expect(ler(numero, "7").data).toBe(7);
    expect(ler(moeda, "197.5").data).toBe(197.5);
    expect(ler(moeda, "R$ 10").success).toBe(false);
  });

  it("lista aceita string única e null", () => {
    expect(ler(lista, "só uma").data).toEqual(["só uma"]);
    expect(ler(lista, null).data).toEqual([]);
  });

  it("selecao e data aceitam '' como vazio", () => {
    expect(ler(selecao, "").data).toBeNull();
    expect(ler(data, "").data).toBeNull();
  });

  it("data aceita Date do YAML", () => {
    expect(ler(data, new Date("2026-11-08T00:00:00Z")).data).toBe("2026-11-08");
  });

  it("ainda recusa o que continua inválido", () => {
    expect(ler(selecao, "z").success).toBe(false);
    expect(ler(numero, "abc").success).toBe(false);
  });
});

describe("criarSchemaItemCompleto", () => {
  const col = obterDefinicao("validacao/primeiros-clientes").colecoes![0];
  const schema = criarSchemaItemCompleto(col);

  it("preenche campos ausentes com o padrão", () => {
    const r = schema.safeParse({ id: "abc", colecao: "clientes", nome: "Ana", status: "fechado" });
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ contato: "", origem: null, valor: null, aprendizado: "" });
  });

  it("aplica obrigatorio", () => {
    const r = schema.safeParse({ id: "abc", colecao: "clientes", nome: "  ", status: null });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path.join("."))).toEqual(["nome", "status"]);
  });

  it("recusa coleção errada e id inválido", () => {
    expect(schema.safeParse({ id: "abc", colecao: "outra", nome: "A", status: "fechado" }).success).toBe(false);
    expect(schema.safeParse({ id: "ABC", colecao: "clientes", nome: "A", status: "fechado" }).success).toBe(false);
  });
});

describe("criarSchemaPatch", () => {
  const def = obterDefinicao("validacao/primeiros-clientes");
  const schema = criarSchemaPatch(def);

  it("aceita patch parcial válido", () => {
    const r = schema.safeParse({
      campos: { meta_de_clientes: 5, prazo_da_meta: null },
      itens: [{ colecao: "clientes", nome: "Ana", status: "conversa" }],
      corpo_anexar: "nota",
    });
    expect(r.success).toBe(true);
    expect(r.data?.campos).toEqual({ meta_de_clientes: 5, prazo_da_meta: null });
  });

  it("recusa chave desconhecida em todos os níveis", () => {
    expect(schema.safeParse({ titulo: "x" }).success).toBe(false);
    expect(schema.safeParse({ campos: { inventado: "x" } }).success).toBe(false);
    expect(schema.safeParse({ itens: [{ colecao: "clientes", nome: "A", extra: 1 }] }).success).toBe(false);
    expect(schema.safeParse({ itens: [{ colecao: "outra", nome: "A" }] }).success).toBe(false);
  });

  it("recusa corpo e corpo_anexar juntos", () => {
    const r = schema.safeParse({ corpo: "a", corpo_anexar: "b" });
    expect(r.success).toBe(false);
  });

  it("recusa patch vazio", () => {
    const r = schema.safeParse({});
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Nada para atualizar.");
  });

  it("valida tipos estritamente", () => {
    expect(schema.safeParse({ campos: { meta_de_clientes: "5" } }).success).toBe(false);
    expect(schema.safeParse({ status: "pronto" }).success).toBe(false);
    expect(schema.safeParse({ relacionados: ["x/y"] }).success).toBe(false);
  });

  it("página sem coleções recusa itens", () => {
    const sem = criarSchemaPatch(obterDefinicao("founder/objetivo"));
    expect(sem.safeParse({ itens: [{ colecao: "x" }] }).success).toBe(false);
  });
});

describe("criarSchemaDocumento", () => {
  const def = obterDefinicao("founder/objetivo");
  const base = () => {
    const fm: Record<string, unknown> = { ...criarTemplate(def) };
    delete fm.corpo;
    delete fm.extras;
    return fm;
  };

  it("preserva chaves desconhecidas em campos e no topo", () => {
    const r = criarSchemaDocumento(def).safeParse({ ...base(), campos: { antigo: "x" }, origem: "importado" });
    expect(r.success).toBe(true);
    const dados = r.data as unknown as Record<string, unknown>;
    expect(dados.origem).toBe("importado");
    expect((dados.campos as Record<string, unknown>).antigo).toBe("x");
    expect((dados.campos as Record<string, unknown>).objetivo_principal).toBe("");
  });

  it("página sem coleções exige itens vazio", () => {
    const r = criarSchemaDocumento(def).safeParse({ ...base(), itens: [{ id: "a", colecao: "x" }] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("Esta página não tem coleções.");
  });

  it("template usa DATA_EPOCA e relacionadosPadrao", () => {
    const t = criarTemplate(def);
    expect(t.atualizado_em).toBe(DATA_EPOCA);
    expect(t.status).toBe("vazio");
    expect(t.relacionados).toEqual(["founder/estilo-de-vida", "direcao/tese-de-valor"]);
  });
});
