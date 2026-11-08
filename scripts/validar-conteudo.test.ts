// Testes do validador de conteúdo (pasta de projeto temporária).
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DOC_IDS } from "@/lib/content/navigation";
import { EXEMPLO_PERFIL } from "@/lib/content/__fixtures__/exemplos";
import { validarProjeto } from "./validar-conteudo";

let raiz: string;

async function escrever(relativo: string, texto: string) {
  const alvo = path.join(raiz, relativo);
  await fs.mkdir(path.dirname(alvo), { recursive: true });
  await fs.writeFile(alvo, texto, "utf8");
}

const AGENTS_MD = [
  "# AGENTS.md",
  "## O que é",
  "## Mapa de documentos",
  ...DOC_IDS.map((id) => `- ${id}`),
  "## Como ler",
  "## Como escrever",
  "## Regras (obrigatórias)",
  "## Agentes e skills",
].join("\n");

beforeEach(async () => {
  raiz = await fs.mkdtemp(path.join(os.tmpdir(), "businessos-"));
  await escrever("AGENTS.md", AGENTS_MD);
  await escrever("skills/contexto-businessos/SKILL.md", "---\nname: contexto-businessos\ndescription: x\n---\n\n# x\n");
  await escrever(
    "agents/estrategista.md",
    "---\nnome: estrategista\npapel: P\ndescricao: D\nle:\n  - founder/objetivo\nskills:\n  - contexto-businessos\n---\n\n# E\n",
  );
});

afterEach(async () => {
  await fs.rm(raiz, { recursive: true, force: true });
});

describe("validarProjeto", () => {
  it("projeto válido: arquivos ausentes viram aviso, não erro", async () => {
    await escrever("content/direcao/perfil-de-cliente-ideal.md", EXEMPLO_PERFIL);
    const r = await validarProjeto({ raizProjeto: raiz });
    expect(r.erros).toEqual([]);
    expect(r.avisos).toHaveLength(11);
  });

  it("arquivo de conteúdo inválido é erro", async () => {
    await escrever("content/direcao/perfil-de-cliente-ideal.md", EXEMPLO_PERFIL.replace("quanto_paga_hoje: 89", "quanto_paga_hoje: x"));
    const r = await validarProjeto({ raizProjeto: raiz });
    expect(r.erros).toEqual([
      expect.objectContaining({ arquivo: "content/direcao/perfil-de-cliente-ideal.md", caminho: "campos.quanto_paga_hoje" }),
    ]);
  });

  it("valida agents/*.md e a existência das skills citadas", async () => {
    await fs.rm(path.join(raiz, "skills"), { recursive: true });
    const r = await validarProjeto({ raizProjeto: raiz });
    expect(r.erros).toEqual([expect.objectContaining({ arquivo: "agents/estrategista.md", caminho: "skills.0" })]);
  });

  it("acusa seção ausente no AGENTS.md e arquivo fora da navegação", async () => {
    await escrever("AGENTS.md", AGENTS_MD.replace("## Como ler", ""));
    await escrever("content/direcao/solto.md", "x");
    const r = await validarProjeto({ raizProjeto: raiz });
    expect(r.erros.map((e) => e.mensagem)).toEqual(['Seção obrigatória ausente: "## Como ler".']);
    expect(r.avisos.map((a) => a.arquivo)).toContain("content/direcao/solto.md");
  });
});
