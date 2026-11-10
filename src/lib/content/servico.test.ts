// Testes do serviço de conteúdo (merge + trava + status automático), com pasta temporária.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErroConteudo } from "@/lib/content/errors";
import { atualizarDocumento, lerDocumento, listarDocumentos } from "@/lib/content/servico";
import { getContentRepository } from "@/lib/content/repository";
import { DATA_EPOCA } from "@/lib/content/schemas/build";
import { EXEMPLO_CLIENTES } from "@/lib/content/__fixtures__/exemplos";

let raiz: string;

beforeEach(async () => {
  raiz = await fs.mkdtemp(path.join(os.tmpdir(), "businessos-"));
  vi.stubEnv("BUSINESSOS_CONTENT_DIR", raiz);
  vi.stubEnv("BUSINESSOS_STORAGE", "fs");
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(raiz, { recursive: true, force: true });
});

async function erroDe(p: Promise<unknown>): Promise<ErroConteudo> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ErroConteudo) return e;
    throw e;
  }
  throw new Error("Era esperado um erro.");
}

describe("repositório padrão", () => {
  it("usa BUSINESSOS_CONTENT_DIR no modo fs e recusa armazenamento desconhecido", () => {
    expect((getContentRepository() as unknown as { raiz: string }).raiz).toBe(path.resolve(raiz));
    vi.stubEnv("BUSINESSOS_STORAGE", "mongo");
    expect(() => getContentRepository()).toThrow("Armazenamento desconhecido: mongo.");
  });
});

describe("atualizarDocumento", () => {
  it("define atualizado_em/atualizado_por e muda vazio → rascunho", async () => {
    const antes = Date.now();
    const doc = await atualizarDocumento({
      id: "direcao/oferta",
      patch: { campos: { nome_da_oferta: "Caixa em Dia" } },
      autor: "agente:estrategista",
    });
    expect(doc.status).toBe("rascunho");
    expect(doc.atualizado_por).toBe("agente:estrategista");
    expect(Date.parse(doc.atualizado_em)).toBeGreaterThanOrEqual(antes);
    expect(await lerDocumento("direcao/oferta")).toEqual(doc);
  });

  it("só notas também tiram do vazio; patch sem conteúdo não", async () => {
    const comNotas = await atualizarDocumento({ id: "founder/objetivo", patch: { corpo: "oi" }, autor: "humano" });
    expect(comNotas.status).toBe("rascunho");
    const semConteudo = await atualizarDocumento({ id: "caixa/erp", patch: { tags: ["x"] }, autor: "humano" });
    expect(semConteudo.status).toBe("vazio");
  });

  it("não rebaixa status nem sobrescreve status enviado", async () => {
    await atualizarDocumento({ id: "caixa/erp", patch: { status: "validado" }, autor: "humano" });
    const doc = await atualizarDocumento({ id: "caixa/erp", patch: { campos: { gargalos: ["x"] } }, autor: "humano" });
    expect(doc.status).toBe("validado");
    const explicito = await atualizarDocumento({
      id: "founder/objetivo",
      patch: { status: "vazio", campos: { meta_12_meses: "x" } },
      autor: "humano",
    });
    expect(explicito.status).toBe("vazio");
  });

  it("CONFLITO quando esperadoAtualizadoEm não bate (com documento atual)", async () => {
    const primeiro = await atualizarDocumento({ id: "caixa/erp", patch: { campos: { gargalos: ["a"] } }, autor: "humano" });
    const erro = await erroDe(
      atualizarDocumento({
        id: "caixa/erp",
        patch: { campos: { gargalos: ["b"] } },
        autor: "humano",
        esperadoAtualizadoEm: DATA_EPOCA,
      }),
    );
    expect(erro.codigo).toBe("CONFLITO");
    expect(erro.message).toMatch(/^O documento foi alterado por humano em \d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}\.$/);
    expect(erro.documentoAtual).toEqual(primeiro);

    // Com o valor certo, grava.
    const ok = await atualizarDocumento({
      id: "caixa/erp",
      patch: { campos: { gargalos: ["b"] } },
      autor: "humano",
      esperadoAtualizadoEm: primeiro.atualizado_em,
    });
    expect(ok.campos.gargalos).toEqual(["b"]);
  });

  it("template (arquivo ausente) aceita esperadoAtualizadoEm = DATA_EPOCA", async () => {
    const doc = await atualizarDocumento({
      id: "founder/objetivo",
      patch: { campos: { meta_12_meses: "x" } },
      autor: "humano",
      esperadoAtualizadoEm: DATA_EPOCA,
    });
    expect(doc.campos.meta_12_meses).toBe("x");
  });

  it("patch inválido → PAYLOAD_INVALIDO com detalhes", async () => {
    const erro = await erroDe(
      atualizarDocumento({ id: "direcao/oferta", patch: { campos: { preco: -1, inventado: 1 } }, autor: "humano" }),
    );
    expect(erro.codigo).toBe("PAYLOAD_INVALIDO");
    expect(erro.message).toBe("Dados inválidos para a página direcao/oferta.");
    expect(erro.detalhes?.map((d) => d.caminho).sort()).toEqual(["campos", "campos.preco"]);
  });

  it("id inválido → NAO_ENCONTRADO", async () => {
    const erro = await erroDe(atualizarDocumento({ id: "../x" as never, patch: { corpo: "x" }, autor: "humano" }));
    expect(erro.codigo).toBe("NAO_ENCONTRADO");
  });

  it("arquivo inválido nunca é sobrescrito", async () => {
    const alvo = path.join(raiz, "validacao", "primeiros-clientes.md");
    const quebrado = EXEMPLO_CLIENTES.replace("valor: 197\n", "valor: muito\n");
    await fs.mkdir(path.dirname(alvo), { recursive: true });
    await fs.writeFile(alvo, quebrado, "utf8");
    const erro = await erroDe(
      atualizarDocumento({ id: "validacao/primeiros-clientes", patch: { corpo: "x" }, autor: "humano" }),
    );
    expect(erro.codigo).toBe("CONTEUDO_INVALIDO");
    expect(await fs.readFile(alvo, "utf8")).toBe(quebrado);
  });

  it("20 atualizações concorrentes em campos distintos persistem todas", async () => {
    const tarefas = Array.from({ length: 20 }, (_, i) =>
      atualizarDocumento({
        id: "validacao/primeiros-clientes",
        patch: { itens: [{ id: `item-${i}`, colecao: "clientes", nome: `Cliente ${i}`, status: "prospect" }] },
        autor: "humano",
      }),
    );
    await Promise.all(tarefas);
    const doc = await lerDocumento("validacao/primeiros-clientes");
    expect(doc.itens.map((i) => i.id).sort()).toEqual(Array.from({ length: 20 }, (_, i) => `item-${i}`).sort());
  });

  it("20 atualizações concorrentes em campos distintos da página", async () => {
    const campos = ["mercado", "regiao", "tamanho_estimado", "ticket_medio_mercado", "tendencias", "alternativas_atuais", "espaco_livre"];
    const valores: Record<string, unknown> = {
      mercado: "m",
      regiao: "r",
      tamanho_estimado: 10,
      ticket_medio_mercado: 50,
      tendencias: ["t"],
      alternativas_atuais: ["a"],
      espaco_livre: "e",
    };
    const tarefas = Array.from({ length: 20 }, (_, i) => {
      const campo = campos[i % campos.length];
      return atualizarDocumento({ id: "direcao/mapa-de-mercado", patch: { campos: { [campo]: valores[campo] } }, autor: "humano" });
    });
    await Promise.all(tarefas);
    const doc = await lerDocumento("direcao/mapa-de-mercado");
    for (const c of campos) expect(doc.campos[c]).toEqual(valores[c]);
  });

  it("uma falha não trava as próximas escritas do mesmo id", async () => {
    await expect(
      atualizarDocumento({ id: "caixa/erp", patch: { campos: { regime_tributario: "x" } }, autor: "humano" }),
    ).rejects.toThrow();
    const doc = await atualizarDocumento({ id: "caixa/erp", patch: { campos: { regime_tributario: "mei" } }, autor: "humano" });
    expect(doc.campos.regime_tributario).toBe("mei");
  });
});

describe("listarDocumentos", () => {
  it("devolve 13 documentos", async () => {
    expect(await listarDocumentos()).toHaveLength(13);
  });
});

describe("fábrica com Supabase", () => {
  it("API de agentes sem BUSINESSOS_API_USER_ID dá erro claro", async () => {
    vi.stubEnv("BUSINESSOS_STORAGE", "supabase");
    vi.stubEnv("BUSINESSOS_API_USER_ID", "");
    const repo = getContentRepository({ contexto: "api" });
    const erro = await erroDe(repo.list());
    expect(erro.codigo).toBe("ERRO_INTERNO");
    expect(erro.message).toContain("BUSINESSOS_API_USER_ID");
  });
});
