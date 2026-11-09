// Testes do repositório em arquivos (diretório temporário por teste).
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ErroConteudo } from "@/lib/content/errors";
import { FileSystemContentRepository } from "@/lib/content/fs-repository";
import { DOC_IDS } from "@/lib/content/navigation";
import { obterDefinicao } from "@/lib/content/schemas";
import { criarTemplate } from "@/lib/content/schemas/build";
import { EXEMPLO_CLIENTES, EXEMPLO_PERFIL } from "@/lib/content/__fixtures__/exemplos";

let raiz: string;
let repo: FileSystemContentRepository;

beforeEach(async () => {
  raiz = await fs.mkdtemp(path.join(os.tmpdir(), "businessos-"));
  repo = new FileSystemContentRepository({ raiz });
});

afterEach(async () => {
  await fs.chmod(raiz, 0o755).catch(() => undefined);
  await fs.rm(raiz, { recursive: true, force: true });
});

async function escrever(relativo: string, texto: string) {
  const alvo = path.join(raiz, relativo);
  await fs.mkdir(path.dirname(alvo), { recursive: true });
  await fs.writeFile(alvo, texto, "utf8");
}

async function arquivosEm(dir: string): Promise<string[]> {
  const saida: string[] = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) saida.push(...(await arquivosEm(p)));
    else saida.push(path.relative(raiz, p));
  }
  return saida;
}

async function erroDe(p: Promise<unknown>): Promise<ErroConteudo> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ErroConteudo) return e;
    throw e;
  }
  throw new Error("Era esperado um erro.");
}

describe("FileSystemContentRepository.get", () => {
  it("arquivo ausente → template, sem criar arquivo", async () => {
    const doc = await repo.get("direcao/oferta");
    expect(doc).toEqual(criarTemplate(obterDefinicao("direcao/oferta")));
    expect(await arquivosEm(raiz)).toEqual([]);
  });

  it("lê arquivo existente", async () => {
    await escrever("direcao/perfil-de-cliente-ideal.md", EXEMPLO_PERFIL);
    const doc = await repo.get("direcao/perfil-de-cliente-ideal");
    expect(doc.campos.quanto_paga_hoje).toBe(89);
  });

  it.each(["../x", "founder/../caixa/erp", "founder%2Fobjetivo", "FOUNDER/objetivo", "founder/objetivo.md"])(
    "id inválido %s → NAO_ENCONTRADO",
    async (id) => {
      const erro = await erroDe(repo.get(id as never));
      expect(erro.codigo).toBe("NAO_ENCONTRADO");
    },
  );

  it("arquivo inválido → CONTEUDO_INVALIDO com detalhes", async () => {
    await escrever("direcao/perfil-de-cliente-ideal.md", EXEMPLO_PERFIL.replace("quanto_paga_hoje: 89", "quanto_paga_hoje: abc"));
    const erro = await erroDe(repo.get("direcao/perfil-de-cliente-ideal"));
    expect(erro.codigo).toBe("CONTEUDO_INVALIDO");
    expect(erro.detalhes?.[0].caminho).toBe("campos.quanto_paga_hoje");
  });

  it("id do front matter divergente do caminho → inválido", async () => {
    await escrever("direcao/tese-de-valor.md", EXEMPLO_PERFIL);
    const erro = await erroDe(repo.get("direcao/tese-de-valor"));
    expect(erro.codigo).toBe("CONTEUDO_INVALIDO");
    expect(erro.detalhes?.some((d) => d.caminho === "id")).toBe(true);
  });
});

describe("FileSystemContentRepository.list", () => {
  it("devolve os 13 na ordem da navegação e ignora arquivos extras", async () => {
    await escrever("validacao/primeiros-clientes.md", EXEMPLO_CLIENTES);
    await escrever("direcao/rascunho-solto.md", "qualquer coisa");
    await escrever("outra/coisa.md", "x");
    const docs = await repo.list();
    expect(docs.map((d) => d.id)).toEqual(DOC_IDS);
    expect(docs[9].itens).toHaveLength(3);
  });

  it("agrega inválidos em um único erro com caminho prefixado pelo id", async () => {
    await escrever("direcao/oferta.md", "---\nid: direcao/oferta\n---\n");
    await escrever(
      "direcao/perfil-de-cliente-ideal.md",
      EXEMPLO_PERFIL.replace("quanto_paga_hoje: 89", "quanto_paga_hoje: -1"),
    );
    const erro = await erroDe(repo.list());
    expect(erro.codigo).toBe("CONTEUDO_INVALIDO");
    expect(erro.message).toBe("Há arquivos de conteúdo inválidos.");
    const caminhos = erro.detalhes?.map((d) => d.caminho) ?? [];
    expect(caminhos).toContain("direcao/perfil-de-cliente-ideal: campos.quanto_paga_hoje");
    expect(caminhos.some((c) => c.startsWith("direcao/oferta: "))).toBe(true);
  });
});

describe("FileSystemContentRepository.save", () => {
  it("cria diretórios, grava e devolve o documento normalizado", async () => {
    const def = obterDefinicao("caixa/erp");
    const doc = { ...criarTemplate(def), titulo: "Mudado à mão", campos: { ...criarTemplate(def).campos, gargalos: [" a "] } };
    const salvo = await repo.save(doc);
    expect(salvo.titulo).toBe("ERP");
    expect(salvo.campos.gargalos).toEqual(["a"]);
    expect(await repo.get("caixa/erp")).toEqual(salvo);
    expect(await arquivosEm(raiz)).toEqual([path.join("caixa", "erp.md")]);
  });

  it("documento inválido → PAYLOAD_INVALIDO e nada é gravado", async () => {
    const def = obterDefinicao("caixa/erp");
    const doc = { ...criarTemplate(def), campos: { ...criarTemplate(def).campos, regime_tributario: "inventado" } };
    const erro = await erroDe(repo.save(doc));
    expect(erro.codigo).toBe("PAYLOAD_INVALIDO");
    expect(await arquivosEm(raiz)).toEqual([]);
  });

  it("nenhum .tmp sobra, mesmo com erro na troca do arquivo", async () => {
    const def = obterDefinicao("founder/objetivo");
    await repo.save(criarTemplate(def));
    // Um diretório no lugar do arquivo faz o rename falhar.
    await fs.rm(path.join(raiz, "founder", "objetivo.md"));
    await fs.mkdir(path.join(raiz, "founder", "objetivo.md", "bloqueio"), { recursive: true });
    await expect(repo.save(criarTemplate(def))).rejects.toThrow();
    const restantes = await arquivosEm(raiz);
    expect(restantes.filter((a) => a.endsWith(".tmp"))).toEqual([]);
  });

  it("pasta somente leitura → ERRO_INTERNO amigável", async () => {
    if (process.getuid?.() === 0) return; // root ignora permissões
    await fs.chmod(raiz, 0o555);
    const erro = await erroDe(repo.save(criarTemplate(obterDefinicao("founder/objetivo"))));
    expect(erro.codigo).toBe("ERRO_INTERNO");
    expect(erro.message).not.toContain(raiz);
  });

  it("existe() reflete o disco", async () => {
    expect(await repo.existe("founder/objetivo")).toBe(false);
    await repo.save(criarTemplate(obterDefinicao("founder/objetivo")));
    expect(await repo.existe("founder/objetivo")).toBe(true);
  });
});
