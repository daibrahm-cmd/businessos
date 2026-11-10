// Testes do GET/PUT /api/context/[secao]/[pagina], com pasta temporária.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "@/app/api/context/[secao]/[pagina]/route";
import { EXEMPLO_CLIENTES } from "@/lib/content/__fixtures__/exemplos";
import { DATA_EPOCA } from "@/lib/content/schemas/build";
import type { ContentDoc } from "@/lib/content/types";

const BASE = "http://127.0.0.1:3000/api/context";
let raiz: string;

beforeEach(async () => {
  raiz = await fs.mkdtemp(path.join(os.tmpdir(), "businessos-"));
  vi.stubEnv("BUSINESSOS_CONTENT_DIR", raiz);
  vi.stubEnv("BUSINESSOS_STORAGE", "fs");
  vi.stubEnv("BUSINESSOS_API_TOKEN", "");
  vi.stubEnv("NODE_ENV", "test");
  await fs.mkdir(path.join(raiz, "validacao"), { recursive: true });
  await fs.writeFile(path.join(raiz, "validacao", "primeiros-clientes.md"), EXEMPLO_CLIENTES);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(raiz, { recursive: true, force: true });
});

function ctx(secao: string, pagina: string) {
  return { params: Promise.resolve({ secao, pagina }) };
}

function get(secao: string, pagina: string, query = "", headers: HeadersInit = {}) {
  return GET(new Request(`${BASE}/${secao}/${pagina}${query}`, { headers }), ctx(secao, pagina));
}

function put(
  secao: string,
  pagina: string,
  corpo: unknown,
  opcoes: { headers?: Record<string, string>; bruto?: string } = {},
) {
  const req = new Request(`${BASE}/${secao}/${pagina}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...opcoes.headers },
    body: opcoes.bruto ?? JSON.stringify(corpo),
  });
  return PUT(req, ctx(secao, pagina));
}

async function json<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

async function codigo(res: Response): Promise<string> {
  return (await json<{ erro: { codigo: string } }>(res)).erro.codigo;
}

describe("GET /api/context/[secao]/[pagina]", () => {
  it("200 com documento + definição; sem cache", async () => {
    const res = await get("validacao", "primeiros-clientes");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const corpo = await json<{ documento: ContentDoc; definicao: { id: string } }>(res);
    expect(corpo.documento.id).toBe("validacao/primeiros-clientes");
    expect(corpo.documento.itens).toHaveLength(3);
    expect(corpo.definicao.id).toBe("validacao/primeiros-clientes");
  });

  it("arquivo ausente com id válido → 200 com o template, sem criar arquivo", async () => {
    const res = await get("caixa", "erp");
    expect(res.status).toBe(200);
    const { documento } = await json<{ documento: ContentDoc }>(res);
    expect(documento.status).toBe("vazio");
    expect(documento.atualizado_em).toBe(DATA_EPOCA);
    await expect(fs.access(path.join(raiz, "caixa", "erp.md"))).rejects.toThrow();
  });

  it("?format=md devolve o arquivo canônico", async () => {
    const res = await get("validacao", "primeiros-clientes", "?format=md");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    const texto = await res.text();
    expect(texto.startsWith("---\nid: validacao/primeiros-clientes\n")).toBe(true);
    expect(texto).toContain("nome: Ana Souza");
    expect(texto.endsWith("\n")).toBe(true);

    const template = await (await get("caixa", "erp", "?format=md")).text();
    expect(template).toContain("id: caixa/erp");
  });

  it("format desconhecido → 400 FORMATO_INVALIDO", async () => {
    const res = await get("validacao", "primeiros-clientes", "?format=xml");
    expect(res.status).toBe(400);
    expect(await codigo(res)).toBe("FORMATO_INVALIDO");
  });

  it("404 para traversal e ids fora da navegação", async () => {
    const casos: [string, string][] = [
      ["..", "package"],
      ["..", ".."],
      ["founder", "..%2F..%2Fpackage"],
      ["founder", "objetivo.md"],
      ["FOUNDER", "objetivo"],
      ["api", "context"],
    ];
    for (const [secao, pagina] of casos) {
      const res = await get(secao, pagina);
      expect(res.status).toBe(404);
      expect(await codigo(res)).toBe("NAO_ENCONTRADO");
    }
  });

  it("arquivo inválido → 422 CONTEUDO_INVALIDO com detalhes", async () => {
    await fs.mkdir(path.join(raiz, "caixa"), { recursive: true });
    await fs.writeFile(path.join(raiz, "caixa", "erp.md"), "---\nid: caixa/erp\nstatus: talvez\n---\n");
    const res = await get("caixa", "erp");
    expect(res.status).toBe(422);
    const { erro } = await json<{ erro: { codigo: string; detalhes: unknown[] } }>(res);
    expect(erro.codigo).toBe("CONTEUDO_INVALIDO");
    expect(erro.detalhes.length).toBeGreaterThan(0);
  });
});

describe("PUT /api/context/[secao]/[pagina]", () => {
  it("200: merge preserva campos e itens não enviados", async () => {
    const res = await put("validacao", "primeiros-clientes", {
      atualizado_por: "agente:teste",
      campos: { meta_de_clientes: 8 },
      itens: [{ id: "f6e7d8c9b0", colecao: "clientes", status: "fechado" }],
      corpo_anexar: "## Sugestão do agente\n- Ligar para a Bruna.",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const { documento } = await json<{ documento: ContentDoc }>(res);
    expect(documento.atualizado_por).toBe("agente:teste");
    expect(documento.campos.meta_de_clientes).toBe(8);
    // Não enviados continuam como estavam.
    expect(documento.campos.prazo_da_meta).toBe("2026-12-15");
    expect(documento.campos.objecoes_recorrentes).toEqual(["Já tenho contador"]);
    expect(documento.itens).toHaveLength(3);
    const bruna = documento.itens.find((i) => i.id === "f6e7d8c9b0");
    expect(bruna).toMatchObject({ status: "fechado", nome: "Bruna Lima", valor: 197 });
    expect(documento.corpo).toContain("## Notas");
    expect(documento.corpo).toContain("- Ligar para a Bruna.");

    // Persistiu em disco.
    const relido = await json<{ documento: ContentDoc }>(await get("validacao", "primeiros-clientes"));
    expect(relido.documento).toEqual(documento);
  });

  it("aceita reenviar o documento do GET (chaves somente-leitura ignoradas)", async () => {
    const { documento } = await json<{ documento: ContentDoc }>(await get("validacao", "primeiros-clientes"));
    const res = await put("validacao", "primeiros-clientes", {
      ...documento,
      titulo: "Outro título (ignorado)",
      atualizado_por: "agente:teste",
      campos: { ...documento.campos, meta_de_clientes: 10 },
    });
    expect(res.status).toBe(200);
    const salvo = (await json<{ documento: ContentDoc }>(res)).documento;
    expect(salvo.titulo).toBe("Primeiros Clientes");
    expect(salvo.campos.meta_de_clientes).toBe(10);
  });

  it("id do corpo diferente da URL → 400 PAYLOAD_INVALIDO", async () => {
    const res = await put("validacao", "primeiros-clientes", {
      id: "caixa/erp",
      atualizado_por: "agente:teste",
      corpo: "x",
    });
    expect(res.status).toBe(400);
    const { erro } = await json<{ erro: { codigo: string; detalhes: { caminho: string; mensagem: string }[] } }>(res);
    expect(erro.codigo).toBe("PAYLOAD_INVALIDO");
    expect(erro.detalhes).toContainEqual({ caminho: "id", mensagem: "O id do corpo não corresponde à URL." });
  });

  it("arquivo ausente: PUT cria a partir do template (200, vazio → rascunho)", async () => {
    const res = await put("caixa", "erp", { atualizado_por: "agente:teste", corpo: "Primeira nota." });
    expect(res.status).toBe(200);
    const { documento } = await json<{ documento: ContentDoc }>(res);
    expect(documento.status).toBe("rascunho");
    await expect(fs.access(path.join(raiz, "caixa", "erp.md"))).resolves.toBeUndefined();
  });

  it("404 em traversal (secao: '..') sem tocar o disco", async () => {
    const res = await put("..", "..", { atualizado_por: "agente:teste", corpo: "x" });
    expect(res.status).toBe(404);
    expect(await codigo(res)).toBe("NAO_ENCONTRADO");
    expect(await fs.readdir(raiz)).toEqual(["validacao"]);
  });

  it("415 sem Content-Type JSON", async () => {
    for (const tipo of ["text/plain", "application/x-www-form-urlencoded"]) {
      const res = await put("caixa", "erp", null, {
        headers: { "Content-Type": tipo },
        bruto: JSON.stringify({ atualizado_por: "agente:teste", corpo: "x" }),
      });
      expect(res.status).toBe(415);
      expect(await codigo(res)).toBe("TIPO_NAO_SUPORTADO");
    }
  });

  it("413 para corpo > 256 KiB (lido) e para Content-Length declarado grande", async () => {
    const grande = JSON.stringify({ atualizado_por: "agente:teste", corpo: "a".repeat(262_144) });
    const res = await put("caixa", "erp", null, { bruto: grande });
    expect(res.status).toBe(413);
    expect(await codigo(res)).toBe("PAYLOAD_GRANDE");

    const declarado = await put("caixa", "erp", null, {
      bruto: "{}",
      headers: { "Content-Length": "300000" },
    });
    expect(declarado.status).toBe(413);
  });

  it("400 JSON_INVALIDO para JSON malformado ou raiz não-objeto", async () => {
    for (const bruto of ["{nao é json", "[1,2]", '"texto"', "null"]) {
      const res = await put("caixa", "erp", null, { bruto });
      expect(res.status).toBe(400);
      expect(await codigo(res)).toBe("JSON_INVALIDO");
    }
  });

  it("400 PAYLOAD_INVALIDO sem atualizado_por ou com humano", async () => {
    const sem = await put("caixa", "erp", { corpo: "x" });
    expect(sem.status).toBe(400);
    const corpoSem = await json<{ erro: { codigo: string; detalhes: { caminho: string }[] } }>(sem);
    expect(corpoSem.erro.codigo).toBe("PAYLOAD_INVALIDO");
    expect(corpoSem.erro.detalhes.map((d) => d.caminho)).toContain("atualizado_por");

    const humano = await put("caixa", "erp", { atualizado_por: "humano", corpo: "x" });
    expect(humano.status).toBe(400);
    expect(await codigo(humano)).toBe("PAYLOAD_INVALIDO");
  });

  it("400 PAYLOAD_INVALIDO: chave desconhecida, patch vazio, corpo+corpo_anexar, coleção trocada, obrigatório vazio", async () => {
    const casos: unknown[] = [
      { atualizado_por: "agente:teste", corpo: "x", desconhecida: 1 },
      { atualizado_por: "agente:teste" },
      { atualizado_por: "agente:teste", id: "validacao/primeiros-clientes" },
      { atualizado_por: "agente:teste", corpo: "x", corpo_anexar: "y" },
      { atualizado_por: "agente:teste", itens: [{ colecao: "clientes", nome: "" , status: "proposta" }] },
    ];
    for (const corpo of casos) {
      const res = await put("validacao", "primeiros-clientes", corpo);
      expect(res.status).toBe(400);
      expect(await codigo(res)).toBe("PAYLOAD_INVALIDO");
    }
  });

  it("409 CONFLITO com o documento atual quando esperado_atualizado_em diverge", async () => {
    const res = await put("validacao", "primeiros-clientes", {
      atualizado_por: "agente:teste",
      esperado_atualizado_em: "2020-01-01T00:00:00.000Z",
      campos: { meta_de_clientes: 9 },
    });
    expect(res.status).toBe(409);
    const corpo = await json<{ erro: { codigo: string }; documento: ContentDoc }>(res);
    expect(corpo.erro.codigo).toBe("CONFLITO");
    expect(corpo.documento.id).toBe("validacao/primeiros-clientes");
    expect(corpo.documento.campos.meta_de_clientes).toBe(5);

    // Com o valor certo, grava.
    const ok = await put("validacao", "primeiros-clientes", {
      atualizado_por: "agente:teste",
      esperado_atualizado_em: corpo.documento.atualizado_em,
      campos: { meta_de_clientes: 9 },
    });
    expect(ok.status).toBe(200);
  });

  it("422 CONTEUDO_INVALIDO e o arquivo inválido não é sobrescrito", async () => {
    await fs.mkdir(path.join(raiz, "caixa"), { recursive: true });
    const arquivo = path.join(raiz, "caixa", "erp.md");
    const invalido = "---\nid: caixa/erp\nstatus: talvez\n---\n";
    await fs.writeFile(arquivo, invalido);
    const res = await put("caixa", "erp", { atualizado_por: "agente:teste", corpo: "x" });
    expect(res.status).toBe(422);
    expect(await codigo(res)).toBe("CONTEUDO_INVALIDO");
    expect(await fs.readFile(arquivo, "utf8")).toBe(invalido);
  });

  describe("acesso", () => {
    it("com token: 401 sem header, 200 com Bearer correto (GET e PUT)", async () => {
      vi.stubEnv("BUSINESSOS_API_TOKEN", "segredo-123");
      const getSem = await get("validacao", "primeiros-clientes");
      expect(getSem.status).toBe(401);
      expect(getSem.headers.get("www-authenticate")).toBe("Bearer");
      expect(await codigo(getSem)).toBe("NAO_AUTORIZADO");

      const putSem = await put("validacao", "primeiros-clientes", { atualizado_por: "agente:teste", corpo: "x" });
      expect(putSem.status).toBe(401);

      const auth = { Authorization: "Bearer segredo-123" };
      expect((await get("validacao", "primeiros-clientes", "", auth)).status).toBe(200);
      const putCom = await put(
        "validacao",
        "primeiros-clientes",
        { atualizado_por: "agente:teste", corpo: "x" },
        { headers: auth },
      );
      expect(putCom.status).toBe(200);
    });

    it("401 vem antes do 404 (não revela ids)", async () => {
      vi.stubEnv("BUSINESSOS_API_TOKEN", "segredo-123");
      expect((await get("..", "..")).status).toBe(401);
    });

    it("NODE_ENV=production sem token → 403 em GET e PUT, sem gravar", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const g = await get("validacao", "primeiros-clientes");
      expect(g.status).toBe(403);
      expect(await codigo(g)).toBe("PROIBIDO");

      const p = await put("caixa", "erp", { atualizado_por: "agente:teste", corpo: "x" });
      expect(p.status).toBe(403);
      expect(await codigo(p)).toBe("PROIBIDO");
      await expect(fs.access(path.join(raiz, "caixa", "erp.md"))).rejects.toThrow();
    });
  });
});
