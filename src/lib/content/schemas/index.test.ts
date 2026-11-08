// Invariantes das 12 definições de página (§3.5).
import { describe, expect, it } from "vitest";
import { DOC_IDS, obterPagina } from "@/lib/content/navigation";
import { DEFINICOES, obterDefinicao } from "@/lib/content/schemas";
import { criarSchemaDocumento, criarTemplate } from "@/lib/content/schemas/build";
import type { FieldDef } from "@/lib/content/schemas/field-types";

const RE_SNAKE = /^[a-z][a-z0-9_]*$/;
const RE_KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function conferirCampos(campos: readonly FieldDef[], onde: string) {
  const nomes = campos.map((c) => c.nome);
  expect(new Set(nomes).size, `${onde}: nomes únicos`).toBe(nomes.length);
  for (const c of campos) {
    expect(c.nome, `${onde}.${c.nome}`).toMatch(RE_SNAKE);
    expect(["id", "colecao"], `${onde}.${c.nome}`).not.toContain(c.nome);
    expect(c.rotulo.length, `${onde}.${c.nome}: rótulo`).toBeGreaterThan(0);
    if (c.tipo === "selecao") {
      const valores = c.opcoes.map((o) => o.valor);
      expect(valores.length, `${onde}.${c.nome}: ≥ 2 opções`).toBeGreaterThanOrEqual(2);
      expect(new Set(valores).size, `${onde}.${c.nome}: opções únicas`).toBe(valores.length);
      for (const v of valores) expect(v, `${onde}.${c.nome}`).toMatch(RE_KEBAB);
    }
  }
}

describe("definições de página", () => {
  it("há exatamente uma definição por id da navegação", () => {
    expect(Object.keys(DEFINICOES).sort()).toEqual([...DOC_IDS].sort());
    for (const id of DOC_IDS) {
      const def = obterDefinicao(id);
      expect(def.id).toBe(id);
      expect(`${def.secao}/${def.pagina}`).toBe(id);
      expect(def.titulo).toBe(obterPagina(id).pagina.titulo);
      expect(def.descricao).toBe(obterPagina(id).pagina.descricao);
    }
  });

  it("obterDefinicao recusa id inválido", () => {
    expect(() => obterDefinicao("x/y" as never)).toThrow(/não encontrado/);
  });

  it.each(DOC_IDS)("%s respeita as invariantes", (id) => {
    const def = obterDefinicao(id);
    expect(def.campos.length).toBeGreaterThanOrEqual(4);
    expect(def.campos.length).toBeLessThanOrEqual(8);
    conferirCampos(def.campos, id);
    expect(def.relacionadosPadrao).not.toContain(id);
    expect(new Set(def.relacionadosPadrao).size).toBe(def.relacionadosPadrao.length);

    const nomesColecoes = (def.colecoes ?? []).map((c) => c.nome);
    expect(new Set(nomesColecoes).size).toBe(nomesColecoes.length);

    for (const col of def.colecoes ?? []) {
      const onde = `${id}#${col.nome}`;
      expect(col.nome).toMatch(RE_SNAKE);
      expect(col.campos.length, onde).toBeGreaterThanOrEqual(4);
      expect(col.campos.length, onde).toBeLessThanOrEqual(8);
      conferirCampos(col.campos, onde);

      const campo = (nome: string) => col.campos.find((c) => c.nome === nome);
      const titulo = campo(col.campoTitulo);
      expect(titulo, `${onde}: campoTitulo existe`).toBeDefined();
      expect(titulo?.obrigatorio, `${onde}: campoTitulo obrigatório`).toBe(true);
      if (col.campoSubtitulo) expect(campo(col.campoSubtitulo), `${onde}: subtítulo`).toBeDefined();
      if (col.campoDestaque) expect(campo(col.campoDestaque)?.tipo, `${onde}: destaque`).toBe("selecao");
      if (col.ordenarPor) expect(campo(col.ordenarPor.campo), `${onde}: ordenarPor`).toBeDefined();

      for (const r of col.resumos ?? []) {
        if (r.filtro) {
          const f = campo(r.filtro.campo);
          expect(f?.tipo, `${onde}: filtro ${r.rotulo}`).toBe("selecao");
          if (f?.tipo === "selecao") expect(f.opcoes.map((o) => o.valor)).toContain(r.filtro.valor);
        }
        if (r.tipo === "soma") expect(["moeda", "numero"]).toContain(campo(r.campo)?.tipo);
        if (r.tipo === "saldo") {
          expect(campo(r.campo)?.tipo).toBe("moeda");
          const tipo = campo(r.campoTipo);
          expect(tipo?.tipo).toBe("selecao");
          if (tipo?.tipo === "selecao") {
            expect(tipo.opcoes.map((o) => o.valor)).toEqual(expect.arrayContaining([r.entrada, r.saida]));
          }
          if (r.campoBase) expect(def.campos.find((c) => c.nome === r.campoBase)?.tipo).toBe("moeda");
        }
      }
    }
  });

  it.each(DOC_IDS)("template de %s passa no schema do documento", (id) => {
    const def = obterDefinicao(id);
    const frontmatter: Record<string, unknown> = { ...criarTemplate(def) };
    delete frontmatter.corpo;
    delete frontmatter.extras;
    const r = criarSchemaDocumento(def).safeParse(frontmatter);
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
  });
});
