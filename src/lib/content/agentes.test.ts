// Testes dos schemas de agentes e skills (§10).
import { describe, expect, it } from "vitest";
import { validarArquivoAgente, validarArquivoSkill } from "@/lib/content/agentes";

const AGENTE = `---
nome: estrategista
papel: Estrategista
descricao: Refina a tese.
le:
  - direcao/tese-de-valor
escreve:
  - direcao/tese-de-valor
skills:
  - contexto-businessos
---

# Estrategista
`;

describe("validarArquivoAgente", () => {
  const skills = new Set(["contexto-businessos"]);

  it("aceita agente válido", () => {
    expect(validarArquivoAgente(AGENTE, "estrategista", skills)).toEqual([]);
  });

  it("nome diferente do arquivo, skill inexistente e id inválido", () => {
    const texto = AGENTE.replace("  - direcao/tese-de-valor\nescreve", "  - direcao/inexistente\nescreve");
    expect(validarArquivoAgente(texto, "estrategista", skills).map((d) => d.caminho)).toEqual(["le.0"]);
    expect(validarArquivoAgente(AGENTE, "outro", skills).map((d) => d.caminho)).toEqual(["nome"]);
    expect(validarArquivoAgente(AGENTE, "estrategista", new Set()).map((d) => d.caminho)).toEqual(["skills.0"]);
  });

  it("recusa chave desconhecida e corpo vazio", () => {
    expect(validarArquivoAgente(AGENTE.replace("papel:", "extra: 1\npapel:"), "estrategista", skills)).not.toEqual([]);
    expect(validarArquivoAgente(AGENTE.replace("# Estrategista\n", ""), "estrategista", skills).map((d) => d.caminho)).toEqual(["corpo"]);
  });
});

describe("validarArquivoSkill", () => {
  const SKILL = "---\nname: contexto-businessos\ndescription: Lê e escreve o contexto.\n---\n\n# Contexto\n";
  it("aceita skill válida e exige name = pasta", () => {
    expect(validarArquivoSkill(SKILL, "contexto-businessos")).toEqual([]);
    expect(validarArquivoSkill(SKILL, "outra").map((d) => d.caminho)).toEqual(["name"]);
    expect(validarArquivoSkill("---\nname: x\n---\n# x\n", "x").map((d) => d.caminho)).toEqual(["description"]);
  });
});
