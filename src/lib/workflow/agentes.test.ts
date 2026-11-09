// Testes da edição de agentes: grava, valida e preserva o resto do arquivo.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ErroAgente, listarAgentesCompletos, nomeExibido, salvarAgente } from "@/lib/workflow/agentes";

let pasta: string;

const ARQUIVO = `---
nome: oferta
papel: Desenhista de oferta
descricao: Monta a oferta.
le:
  - direcao/oferta
escreve:
  - direcao/oferta
skills: []
---

# Desenhista de oferta

Passo 1.
`;

beforeEach(async () => {
  pasta = await fs.mkdtemp(path.join(os.tmpdir(), "agentes-"));
  process.env.BUSINESSOS_AGENTS_DIR = pasta;
  await fs.writeFile(path.join(pasta, "oferta.md"), ARQUIVO);
});
afterEach(async () => {
  delete process.env.BUSINESSOS_AGENTS_DIR;
  await fs.rm(pasta, { recursive: true, force: true });
});

describe("salvarAgente", () => {
  it("grava apelido, texto com aspas/dois-pontos e instruções, e relê igual", async () => {
    const [antes] = await listarAgentesCompletos();
    expect(nomeExibido(antes)).toBe("oferta");

    await salvarAgente("oferta", {
      apelido: "Otto",
      papel: "Desenhista: de oferta",
      descricao: 'Monta a "oferta" — e checa a conta.',
      le: ["direcao/oferta", "founder/objetivo"],
      escreve: [],
      instrucoes: "# Novo\n\nPasso A.",
    });
    const [depois] = await listarAgentesCompletos();
    expect(depois).toMatchObject({
      nome: "oferta",
      apelido: "Otto",
      papel: "Desenhista: de oferta",
      descricao: 'Monta a "oferta" — e checa a conta.',
      le: ["direcao/oferta", "founder/objetivo"],
      escreve: [],
      instrucoes: "# Novo\n\nPasso A.",
    });
    expect(nomeExibido(depois)).toBe("Otto");
    expect((await fs.readdir(pasta)).filter((f) => f.endsWith(".tmp"))).toEqual([]);
  });

  it("apelido vazio remove o apelido; entrada inválida e agente inexistente falham", async () => {
    await salvarAgente("oferta", { apelido: "X", papel: "p", descricao: "d", le: ["direcao/oferta"], escreve: [], instrucoes: "i" });
    await salvarAgente("oferta", { apelido: "  ", papel: "p", descricao: "d", le: ["direcao/oferta"], escreve: [], instrucoes: "i" });
    expect((await listarAgentesCompletos())[0].apelido).toBeUndefined();

    await expect(
      salvarAgente("oferta", { apelido: undefined, papel: "p", descricao: "d", le: [], escreve: [], instrucoes: "i" }),
    ).rejects.toMatchObject({ codigo: "PAYLOAD_INVALIDO" });
    await expect(
      salvarAgente("nao-existe", { apelido: undefined, papel: "p", descricao: "d", le: ["direcao/oferta"], escreve: [], instrucoes: "i" }),
    ).rejects.toBeInstanceOf(ErroAgente);
  });
});
