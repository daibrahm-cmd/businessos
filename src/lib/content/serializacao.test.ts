// Testes de leitura/escrita do formato .md.
import { describe, expect, it } from "vitest";
import matter from "gray-matter";
import { ErroConteudo } from "@/lib/content/errors";
import { obterDefinicao } from "@/lib/content/schemas";
import { criarTemplate } from "@/lib/content/schemas/build";
import {
  CHAVES_CANONICAS,
  desserializar,
  normalizarCorpo,
  normalizarParaGravar,
  serializar,
} from "@/lib/content/serializacao";
import { EXEMPLO_CLIENTES, EXEMPLO_PERFIL } from "@/lib/content/__fixtures__/exemplos";

const defPerfil = obterDefinicao("direcao/perfil-de-cliente-ideal");
const defClientes = obterDefinicao("validacao/primeiros-clientes");

function erroDe(fn: () => unknown): ErroConteudo {
  try {
    fn();
  } catch (e) {
    if (e instanceof ErroConteudo) return e;
    throw e;
  }
  throw new Error("Era esperado um erro.");
}

describe("desserializar", () => {
  it("lê os dois exemplos da spec sem erro", () => {
    const perfil = desserializar(EXEMPLO_PERFIL, defPerfil);
    expect(perfil.status).toBe("rascunho");
    expect(perfil.campos.quanto_paga_hoje).toBe(89);
    expect(perfil.campos.dores).toHaveLength(3);
    expect(perfil.corpo.startsWith("## Notas\n")).toBe(true);
    expect(perfil.extras).toEqual({});

    const clientes = desserializar(EXEMPLO_CLIENTES, defClientes);
    expect(clientes.atualizado_por).toBe("agente:estrategista");
    expect(clientes.campos.prazo_da_meta).toBe("2026-12-15");
    expect(clientes.itens).toHaveLength(3);
    expect(clientes.itens[2].valor).toBeNull();
  });

  it("normaliza Date do YAML (data-hora e campos data sem aspas)", () => {
    const texto = EXEMPLO_CLIENTES.replace("'2026-11-08T18:05:44.120Z'", "2026-11-08T18:05:44.120Z").replace(
      "'2026-12-15'",
      "2026-12-15",
    );
    const doc = desserializar(texto, defClientes);
    expect(doc.atualizado_em).toBe("2026-11-08T18:05:44.120Z");
    expect(doc.campos.prazo_da_meta).toBe("2026-12-15");
  });

  it("aceita \\r\\n e BOM", () => {
    const doc = desserializar(`﻿${EXEMPLO_PERFIL.replace(/\n/g, "\r\n")}`, defPerfil);
    expect(doc.corpo).not.toContain("\r");
  });

  it("id divergente do caminho é inválido", () => {
    const erro = erroDe(() => desserializar(EXEMPLO_PERFIL, obterDefinicao("direcao/tese-de-valor")));
    expect(erro.codigo).toBe("CONTEUDO_INVALIDO");
    expect(erro.detalhes?.map((d) => d.caminho)).toContain("id");
  });

  it("YAML quebrado vira CONTEUDO_INVALIDO", () => {
    const erro = erroDe(() => desserializar("---\nid: [\n---\n", defPerfil));
    expect(erro.codigo).toBe("CONTEUDO_INVALIDO");
    expect(erro.message).toBe("O arquivo content/direcao/perfil-de-cliente-ideal.md tem erros.");
  });

  it("valor inválido aponta o caminho", () => {
    const erro = erroDe(() => desserializar(EXEMPLO_PERFIL.replace("quanto_paga_hoje: 89", "quanto_paga_hoje: -5"), defPerfil));
    expect(erro.detalhes?.map((d) => d.caminho)).toEqual(["campos.quanto_paga_hoje"]);
  });

  it("chaves vazias (null) caem no padrão", () => {
    const doc = desserializar(EXEMPLO_PERFIL.replace(/tags:\n  - mei\n  - servicos\n/, "tags:\n"), defPerfil);
    expect(doc.tags).toEqual([]);
  });
});

describe("serializar", () => {
  it("ida e volta preserva o documento", () => {
    for (const [texto, def] of [
      [EXEMPLO_PERFIL, defPerfil],
      [EXEMPLO_CLIENTES, defClientes],
    ] as const) {
      const doc = desserializar(texto, def);
      expect(desserializar(serializar(doc, def), def)).toEqual(doc);
      // Serializar duas vezes é estável.
      expect(serializar(desserializar(serializar(doc, def), def), def)).toBe(serializar(doc, def));
    }
  });

  it("grava chaves na ordem canônica e extras no fim", () => {
    const doc = desserializar(EXEMPLO_CLIENTES, defClientes);
    doc.extras = { origem: "importado" };
    doc.campos = { antigo: "x", ...doc.campos };
    doc.itens[0] = { extra_item: "y", ...doc.itens[0] };
    const texto = serializar(doc, defClientes);
    const dados = matter(texto, {}).data as Record<string, unknown>;
    expect(Object.keys(dados)).toEqual([...CHAVES_CANONICAS, "origem"]);
    expect(Object.keys(dados.campos as object)).toEqual([...defClientes.campos.map((c) => c.nome), "antigo"]);
    const item = (dados.itens as Record<string, unknown>[])[0];
    expect(Object.keys(item)).toEqual([
      "id",
      "colecao",
      ...defClientes.colecoes![0].campos.map((c) => c.nome),
      "extra_item",
    ]);
    expect(desserializar(texto, defClientes).extras).toEqual({ origem: "importado" });
  });

  it("atualizado_em sai entre aspas, valores vazios explícitos e \\n final", () => {
    const texto = serializar(criarTemplate(defClientes), defClientes);
    expect(texto).toContain("atualizado_em: '1970-01-01T00:00:00.000Z'\n");
    expect(texto).toContain("  meta_de_clientes: null\n");
    expect(texto).toContain("  roteiro_de_abordagem: ''\n");
    expect(texto).toContain("  principais_aprendizados: []\n");
    expect(texto.endsWith("---\n")).toBe(true);
  });

  it("corpo vem depois de uma linha em branco e termina com \\n", () => {
    const doc = { ...criarTemplate(defPerfil), corpo: "## Notas\n\ntexto" };
    const texto = serializar(doc, defPerfil);
    expect(texto.endsWith("---\n\n## Notas\n\ntexto\n")).toBe(true);
  });
});

describe("normalizarCorpo", () => {
  it("remove linhas em branco do começo e garante um \\n final", () => {
    expect(normalizarCorpo("\n\n# T\r\nx  \n\n\n")).toBe("# T\nx\n");
    expect(normalizarCorpo("  \n \n")).toBe("");
  });
});

describe("normalizarParaGravar", () => {
  it("corrige campos do sistema vindos da definição", () => {
    const doc = { ...criarTemplate(defPerfil), titulo: "Outro", descricao: "Mudou" };
    const r = normalizarParaGravar(doc, defPerfil);
    expect(r.titulo).toBe(defPerfil.titulo);
    expect(r.descricao).toBe(defPerfil.descricao);
  });

  it("aplica obrigatorio nos itens → PAYLOAD_INVALIDO", () => {
    const doc = desserializar(EXEMPLO_CLIENTES, defClientes);
    doc.itens[1] = { ...doc.itens[1], nome: "" };
    const erro = erroDe(() => normalizarParaGravar(doc, defClientes));
    expect(erro.codigo).toBe("PAYLOAD_INVALIDO");
    expect(erro.detalhes?.map((d) => d.caminho)).toEqual(["itens.1.nome"]);
  });
});
