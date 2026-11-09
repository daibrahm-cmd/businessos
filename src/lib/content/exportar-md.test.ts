// Testes do Markdown consolidado (§6.3).
import { describe, expect, it } from "vitest";
import { exportarMarkdown } from "@/lib/content/exportar-md";
import { obterDefinicao } from "@/lib/content/schemas";
import { criarTemplate } from "@/lib/content/schemas/build";
import { desserializar } from "@/lib/content/serializacao";
import type { ContentDoc } from "@/lib/content/types";
import { EXEMPLO_CLIENTES, EXEMPLO_PERFIL } from "@/lib/content/__fixtures__/exemplos";

const GERADO_EM = "2026-11-08T18:10:00.000Z";
const perfil = () => desserializar(EXEMPLO_PERFIL, obterDefinicao("direcao/perfil-de-cliente-ideal"));
const clientes = () => desserializar(EXEMPLO_CLIENTES, obterDefinicao("validacao/primeiros-clientes"));
const vazio = () => criarTemplate(obterDefinicao("founder/estilo-de-vida"));

describe("exportarMarkdown", () => {
  it("snapshot com os 2 exemplos + 1 vazio", () => {
    const md = exportarMarkdown([vazio(), perfil(), clientes()], {}, GERADO_EM);
    expect(md).toMatchSnapshot();
  });

  it("cabeçalho, seções só quando têm documentos e \\n final", () => {
    const md = exportarMarkdown([perfil()], {}, GERADO_EM);
    expect(md.startsWith("# BusinessOS — contexto do negócio\n\n> Estágio: Sistema de marca viva · Gerado em 2026-11-08T18:10:00.000Z · 1 documento\n\n## DIREÇÃO\n\n")).toBe(true);
    expect(md).not.toContain("## FOUNDER");
    expect(md.endsWith("\n")).toBe(true);
    expect(md.endsWith("\n\n")).toBe(false);
    expect(md).not.toMatch(/\n{3,}/);
  });

  it("linha de status traz atualizado_em em ISO", () => {
    const md = exportarMarkdown([perfil(), vazio()], {}, GERADO_EM);
    expect(md).toContain(
      "Status: Rascunho · Atualizado em 08/11/2026 às 11:32 por humano · atualizado_em: `2026-11-08T14:32:10.000Z`",
    );
    expect(md).toContain("Status: Vazio · Ainda não editado · atualizado_em: `1970-01-01T00:00:00.000Z`\n\n_(sem conteúdo)_");
  });

  it("omite campos vazios e formata valores", () => {
    const doc: ContentDoc = clientes();
    doc.campos.roteiro_de_abordagem = "";
    doc.campos.principais_aprendizados = [];
    const md = exportarMarkdown([doc], {}, GERADO_EM);
    expect(md).not.toContain("Roteiro de abordagem");
    expect(md).not.toContain("Principais aprendizados");
    expect(md).toContain("**Meta de clientes no teste:** 5\n");
    expect(md).toContain("**Prazo da meta:** 15/12/2026\n");
    expect(md).toContain(
      "- **Ana Souza** — Contato: @ana.nails · Origem: Instagram · Status: Fechado · Valor: R$ 197,00 · Próximo passo: Onboarding na segunda · Aprendizado: Fechou depois de ver o próprio DRE simplificado na call.",
    );
    // Campos vazios do item também são omitidos.
    expect(md).toContain("- **Salão Bela Vida** — Origem: Evento · Status: Perdido · Aprendizado:");
    expect(md).toContain("Resumo: Clientes fechados: 1 · Receita fechada: R$ 197,00");
  });

  it("rebaixa headings do corpo em 4 níveis (máximo ######), fora de blocos de código", () => {
    const doc = { ...perfil(), corpo: "# Um\n## Dois\n### Três\n```\n# código\n```\n" };
    const md = exportarMarkdown([doc], {}, GERADO_EM);
    expect(md).toContain("#### Notas\n\n##### Um\n###### Dois\n###### Três\n```\n# código\n```\n");
  });

  it("texto longo em item vira uma linha", () => {
    const doc = clientes();
    doc.itens[0].aprendizado = "linha 1\nlinha 2";
    expect(exportarMarkdown([doc], {}, GERADO_EM)).toContain("Aprendizado: linha 1 linha 2\n");
  });
});
