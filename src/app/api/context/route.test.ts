// Testes do GET /api/context (lista consolidada em JSON ou Markdown), com pasta temporária.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/context/route";
import { EXEMPLO_CLIENTES, EXEMPLO_PERFIL } from "@/lib/content/__fixtures__/exemplos";
import { DOC_IDS } from "@/lib/content/navigation";

const BASE = "http://127.0.0.1:3000/api/context";
let raiz: string;

beforeEach(async () => {
  raiz = await fs.mkdtemp(path.join(os.tmpdir(), "businessos-"));
  vi.stubEnv("BUSINESSOS_CONTENT_DIR", raiz);
  vi.stubEnv("BUSINESSOS_STORAGE", "fs");
  vi.stubEnv("BUSINESSOS_API_TOKEN", "");
  vi.stubEnv("NODE_ENV", "test");
  await fs.mkdir(path.join(raiz, "direcao"), { recursive: true });
  await fs.mkdir(path.join(raiz, "validacao"), { recursive: true });
  await fs.writeFile(path.join(raiz, "direcao", "perfil-de-cliente-ideal.md"), EXEMPLO_PERFIL);
  await fs.writeFile(path.join(raiz, "validacao", "primeiros-clientes.md"), EXEMPLO_CLIENTES);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await fs.rm(raiz, { recursive: true, force: true });
});

async function json(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

function idsDe(corpo: Record<string, unknown>): string[] {
  return (corpo.documentos as { id: string }[]).map((d) => d.id);
}

describe("GET /api/context", () => {
  it("JSON 200 com os 13 documentos na ordem da navegação, sem cache", async () => {
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
    const corpo = await json(res);
    expect(corpo.estagio).toBe("para-quem-esta-comecando");
    expect(typeof corpo.gerado_em).toBe("string");
    expect(idsDe(corpo)).toEqual([...DOC_IDS]);
    expect(corpo.definicoes).toBeUndefined();
  });

  it("?format=json explícito também funciona; ?definicoes=1 inclui as definições", async () => {
    const res = await GET(new Request(`${BASE}?format=json&secao=founder&definicoes=1`));
    expect(res.status).toBe(200);
    const corpo = await json(res);
    expect(Object.keys(corpo.definicoes as object)).toEqual(["founder/objetivo", "founder/estilo-de-vida"]);
  });

  it("?format=md devolve text/markdown com o consolidado", async () => {
    const res = await GET(new Request(`${BASE}?format=md`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const texto = await res.text();
    expect(texto.startsWith("# BusinessOS — contexto do negócio\n\n> Estágio: Sistema de marca viva")).toBe(true);
    expect(texto).toContain("· 13 documentos");
    expect(texto).toContain("### Primeiros Clientes (`validacao/primeiros-clientes`)");
    expect(texto).toContain("**Ana Souza**");
    expect(texto.endsWith("\n")).toBe(true);
  });

  it("?secao filtra", async () => {
    const corpo = await json(await GET(new Request(`${BASE}?secao=caixa`)));
    expect(idsDe(corpo)).toEqual(["caixa/fluxo-de-caixa", "caixa/erp"]);
  });

  it("?ids filtra mantendo a ordem da navegação", async () => {
    const corpo = await json(await GET(new Request(`${BASE}?ids=caixa/erp,founder/objetivo`)));
    expect(idsDe(corpo)).toEqual(["founder/objetivo", "caixa/erp"]);
  });

  it("?secao e ?ids juntos → interseção; md respeita o filtro", async () => {
    const corpo = await json(
      await GET(new Request(`${BASE}?secao=validacao&ids=validacao/primeiros-clientes,caixa/erp`)),
    );
    expect(idsDe(corpo)).toEqual(["validacao/primeiros-clientes"]);

    const md = await (await GET(new Request(`${BASE}?format=md&secao=direcao`))).text();
    expect(md).toContain("· 5 documentos");
    expect(md).toContain("## DIREÇÃO");
    expect(md).not.toContain("## FOUNDER");
  });

  it("id inválido em ?ids → 404 NAO_ENCONTRADO", async () => {
    for (const ids of ["founder/objetivo,../etc/passwd", "founder/nada", ","]) {
      const res = await GET(new Request(`${BASE}?ids=${encodeURIComponent(ids)}`));
      expect(res.status).toBe(404);
      expect(((await json(res)).erro as { codigo: string }).codigo).toBe("NAO_ENCONTRADO");
    }
  });

  it("seção inválida → 404 NAO_ENCONTRADO", async () => {
    for (const secao of ["api", "..", "FOUNDER", ""]) {
      const res = await GET(new Request(`${BASE}?secao=${encodeURIComponent(secao)}`));
      expect(res.status).toBe(404);
      expect(((await json(res)).erro as { codigo: string }).codigo).toBe("NAO_ENCONTRADO");
    }
  });

  it("format=xml → 400 FORMATO_INVALIDO", async () => {
    const res = await GET(new Request(`${BASE}?format=xml`));
    expect(res.status).toBe(400);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await json(res)).toEqual({
      erro: { codigo: "FORMATO_INVALIDO", mensagem: 'Formato inválido. Use "json" ou "md".' },
    });
  });

  it("arquivo em disco inválido → 422 CONTEUDO_INVALIDO com detalhes", async () => {
    await fs.mkdir(path.join(raiz, "caixa"), { recursive: true });
    await fs.writeFile(path.join(raiz, "caixa", "erp.md"), "---\nid: caixa/erp\nstatus: talvez\n---\n");
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(422);
    const erro = (await json(res)).erro as { codigo: string; detalhes: unknown[] };
    expect(erro.codigo).toBe("CONTEUDO_INVALIDO");
    expect(erro.detalhes.length).toBeGreaterThan(0);
  });

  it("falha inesperada → 500 ERRO_INTERNO sem expor detalhes", async () => {
    // Raiz apontando para um arquivo: a leitura falha com ENOTDIR (erro cru do Node).
    const arquivo = path.join(raiz, "nao-e-pasta");
    await fs.writeFile(arquivo, "x");
    vi.stubEnv("BUSINESSOS_CONTENT_DIR", arquivo);
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await GET(new Request(BASE));
    expect(res.status).toBe(500);
    const corpo = await res.text();
    expect(JSON.parse(corpo)).toEqual({ erro: { codigo: "ERRO_INTERNO", mensagem: "Erro interno. Tente de novo." } });
    expect(corpo).not.toContain(raiz);
    expect(log).toHaveBeenCalled();
  });

  describe("acesso", () => {
    it("com token: 401 sem header (WWW-Authenticate), 401 com token errado, 200 com Bearer correto", async () => {
      vi.stubEnv("BUSINESSOS_API_TOKEN", "segredo-123");
      const sem = await GET(new Request(BASE));
      expect(sem.status).toBe(401);
      expect(sem.headers.get("www-authenticate")).toBe("Bearer");
      expect(((await json(sem)).erro as { codigo: string }).codigo).toBe("NAO_AUTORIZADO");

      const errado = await GET(new Request(BASE, { headers: { Authorization: "Bearer outro" } }));
      expect(errado.status).toBe(401);

      const certo = await GET(new Request(BASE, { headers: { Authorization: "Bearer segredo-123" } }));
      expect(certo.status).toBe(200);
    });

    it("NODE_ENV=production sem token → 403 PROIBIDO (antes de validar format)", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const res = await GET(new Request(`${BASE}?format=xml`));
      expect(res.status).toBe(403);
      expect(((await json(res)).erro as { codigo: string }).codigo).toBe("PROIBIDO");
    });
  });
});
