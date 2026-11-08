// Testes do merge puro (§5.4).
import { describe, expect, it } from "vitest";
import { ErroConteudo } from "@/lib/content/errors";
import { aplicarPatch, gerarIdItem } from "@/lib/content/merge";
import { obterDefinicao } from "@/lib/content/schemas";
import { desserializar } from "@/lib/content/serializacao";
import type { ContentDoc, DocPatch } from "@/lib/content/types";
import { EXEMPLO_CLIENTES } from "@/lib/content/__fixtures__/exemplos";

const def = obterDefinicao("validacao/primeiros-clientes");
const atual = (): ContentDoc => desserializar(EXEMPLO_CLIENTES, def);
const aplicar = (patch: DocPatch, doc = atual()) => aplicarPatch(doc, patch, def, () => "novoid0001");

function erroDe(fn: () => unknown): ErroConteudo {
  try {
    fn();
  } catch (e) {
    if (e instanceof ErroConteudo) return e;
    throw e;
  }
  throw new Error("Era esperado um erro.");
}

describe("aplicarPatch", () => {
  it("não altera o documento original", () => {
    const doc = atual();
    const copia = structuredClone(doc);
    aplicar({ campos: { meta_de_clientes: 9 }, itens_remover: ["a1b2c3d4e5"] }, doc);
    expect(doc).toEqual(copia);
  });

  it("preserva campos não enviados e null limpa", () => {
    const novo = aplicar({ campos: { meta_de_clientes: 9, roteiro_de_abordagem: null } });
    expect(novo.campos.meta_de_clientes).toBe(9);
    expect(novo.campos.roteiro_de_abordagem).toBe("");
    expect(novo.campos.prazo_da_meta).toBe("2026-12-15");
    expect(novo.campos.principais_aprendizados).toEqual(["Quem tem DAS atrasado fecha mais rápido"]);
  });

  it("upsert por id faz merge raso do item", () => {
    const novo = aplicar({ itens: [{ id: "f6e7d8c9b0", colecao: "clientes", status: "fechado" }] });
    const item = novo.itens.find((i) => i.id === "f6e7d8c9b0");
    expect(item).toMatchObject({ nome: "Bruna Lima", status: "fechado", valor: 197, proximo_passo: "Retornar na sexta" });
    expect(novo.itens.map((i) => i.id)).toEqual(["a1b2c3d4e5", "f6e7d8c9b0", "0c9d8e7f6a"]);
  });

  it("item sem id ganha id gerado e vai para o fim com padrões", () => {
    const novo = aplicar({ itens: [{ colecao: "clientes", nome: "Carla", status: "prospect" }] });
    expect(novo.itens).toHaveLength(4);
    expect(novo.itens[3]).toMatchObject({ id: "novoid0001", colecao: "clientes", nome: "Carla", contato: "", valor: null });
  });

  it("id novo explícito cria o item com esse id", () => {
    const novo = aplicar({ itens: [{ id: "meu-id", colecao: "clientes", nome: "Dani", status: "conversa" }] });
    expect(novo.itens.at(-1)?.id).toBe("meu-id");
  });

  it("gerarIdItem não colide", () => {
    const id = gerarIdItem(new Set(["a"]));
    expect(id).toMatch(/^[a-z0-9]{10}$/);
  });

  it("troca de coleção é erro", () => {
    const defErp = obterDefinicao("caixa/erp");
    const base = {
      ...atual(),
      id: "caixa/erp" as const,
      secao: "caixa" as const,
      pagina: "erp",
      campos: {},
      itens: [{ id: "p1", colecao: "processos", nome: "NF" }],
    } as ContentDoc;
    const erro = erroDe(() => aplicarPatch(base, { itens: [{ id: "p1", colecao: "ferramentas", nome: "x" }] }, defErp));
    expect(erro.codigo).toBe("PAYLOAD_INVALIDO");
    expect(erro.detalhes?.[0]).toEqual({ caminho: "itens.0.colecao", mensagem: "Item p1 pertence à coleção processos." });
  });

  it("obrigatorio vazio é erro com caminho do patch", () => {
    const erro = erroDe(() => aplicar({ itens: [{ colecao: "clientes", nome: "Sem status" }] }));
    expect(erro.detalhes?.map((d) => d.caminho)).toEqual(["itens.0.status"]);
  });

  it("itens_remover é idempotente e vem antes de itens", () => {
    const novo = aplicar({ itens_remover: ["a1b2c3d4e5", "nao-existe"] });
    expect(novo.itens.map((i) => i.id)).toEqual(["f6e7d8c9b0", "0c9d8e7f6a"]);
    expect(aplicar({ itens_remover: ["a1b2c3d4e5"] }, novo)).toEqual(novo);

    // Remover e recriar o mesmo id no mesmo patch: o item volta como novo (no fim).
    const recriado = aplicar({
      itens_remover: ["a1b2c3d4e5"],
      itens: [{ id: "a1b2c3d4e5", colecao: "clientes", nome: "Ana 2", status: "conversa" }],
    });
    expect(recriado.itens.at(-1)).toMatchObject({ id: "a1b2c3d4e5", nome: "Ana 2", valor: null });
  });

  it("corpo substitui e corpo_anexar acrescenta com uma linha em branco", () => {
    expect(aplicar({ corpo: "novo" }).corpo).toBe("novo");
    const anexado = aplicar({ corpo_anexar: "  ## Sugestão\n- x  " });
    expect(anexado.corpo.endsWith("rodada.\n\n## Sugestão\n- x\n")).toBe(true);
    const vazio = aplicar({ corpo_anexar: "primeira" }, { ...atual(), corpo: "  \n" });
    expect(vazio.corpo).toBe("primeira\n");
  });

  it("status, tags e relacionados substituem; metadados do sistema não mudam", () => {
    const doc = atual();
    const patch = {
      status: "validado",
      tags: ["a"],
      relacionados: ["founder/objetivo"],
      id: "founder/objetivo",
      titulo: "X",
      atualizado_em: "2030-01-01T00:00:00.000Z",
      atualizado_por: "humano",
      extras: { x: 1 },
    } as unknown as DocPatch;
    const novo = aplicar(patch, doc);
    expect(novo.status).toBe("validado");
    expect(novo.tags).toEqual(["a"]);
    expect(novo.relacionados).toEqual(["founder/objetivo"]);
    expect(novo.id).toBe(doc.id);
    expect(novo.titulo).toBe(doc.titulo);
    expect(novo.atualizado_em).toBe(doc.atualizado_em);
    expect(novo.atualizado_por).toBe(doc.atualizado_por);
    expect(novo.extras).toEqual(doc.extras);
  });

  it("respeita maxItens da coleção", () => {
    const defLimitada = {
      ...def,
      colecoes: [{ ...def.colecoes![0], maxItens: 3 }],
    };
    const erro = erroDe(() =>
      aplicarPatch(atual(), { itens: [{ colecao: "clientes", nome: "X", status: "prospect" }] }, defLimitada),
    );
    expect(erro.detalhes?.[0].mensagem).toBe("A coleção Clientes aceita no máximo 3 itens.");
  });
});
