// src/lib/content/exportar-md.ts
// Markdown consolidado do contexto do negócio (GET /api/context?format=md), pensado para prompts de agentes.
import { formatarData, formatarDataHora, formatarMoeda, formatarNumero } from "@/lib/format";
import { NAVEGACAO, ROTULO_ESTAGIO, ESTAGIO_ATUAL, type DocId } from "@/lib/content/navigation";
import { DATA_EPOCA } from "@/lib/content/schemas/build";
import { obterDefinicao } from "@/lib/content/schemas";
import type { CollectionDef, FieldDef, PageDefinition } from "@/lib/content/schemas/field-types";
import { calcularCompletude, campoPreenchido } from "@/lib/content/completude";
import { calcularResumos, ordenarItensParaExibicao } from "@/lib/content/resumos";
import type { ContentDoc, ResumoCalculado, Status } from "@/lib/content/types";

/** Rótulos PT-BR dos status. */
export const ROTULO_STATUS: Record<Status, string> = {
  vazio: "Vazio",
  rascunho: "Rascunho",
  "em-validacao": "Em validação",
  validado: "Validado",
};

/** Valor de um campo preenchido, formatado para leitura (seleção pelo rótulo, moeda/número/data formatados). */
export function formatarValorCampo(campo: FieldDef, valor: unknown): string {
  switch (campo.tipo) {
    case "moeda":
      return typeof valor === "number" ? formatarMoeda(valor) : String(valor);
    case "numero":
      return typeof valor === "number" ? formatarNumero(valor, campo.unidade) : String(valor);
    case "data":
      return formatarData(String(valor));
    case "selecao":
      return campo.opcoes.find((o) => o.valor === valor)?.rotulo ?? String(valor);
    case "lista-texto":
      return Array.isArray(valor) ? valor.join(", ") : String(valor);
    default:
      return String(valor).trimEnd();
  }
}

export function formatarResumo(resumo: ResumoCalculado): string {
  return resumo.formato === "moeda" ? formatarMoeda(resumo.valor) : formatarNumero(resumo.valor);
}

/** Rebaixa cada heading do corpo em 4 níveis (máximo ######), ignorando blocos de código. */
function rebaixarHeadings(corpo: string): string {
  let emCodigo = false;
  return corpo
    .split("\n")
    .map((linha) => {
      if (/^\s*(```|~~~)/.test(linha)) emCodigo = !emCodigo;
      if (emCodigo) return linha;
      return linha.replace(/^(#{1,6})(\s)/, (_, hashes: string, espaco: string) =>
        "#".repeat(Math.min(hashes.length + 4, 6)) + espaco,
      );
    })
    .join("\n");
}

function linhaDeStatus(doc: ContentDoc): string {
  // atualizado_em em ISO: agentes usam esse valor em esperado_atualizado_em.
  const iso = `atualizado_em: \`${doc.atualizado_em}\``;
  if (doc.atualizado_em === DATA_EPOCA) return `Status: Vazio · Ainda não editado · ${iso}`;
  return `Status: ${ROTULO_STATUS[doc.status]} · Atualizado em ${formatarDataHora(doc.atualizado_em)} por ${doc.atualizado_por} · ${iso}`;
}

function blocosDeCampos(doc: ContentDoc, def: PageDefinition): string[] {
  const blocos: string[] = [];
  for (const campo of def.campos) {
    const valor = doc.campos[campo.nome];
    if (!campoPreenchido(campo, valor)) continue;
    if (campo.tipo === "lista-texto" && Array.isArray(valor)) {
      blocos.push([`**${campo.rotulo}:**`, ...valor.map((v) => `- ${v}`)].join("\n"));
    } else {
      blocos.push(`**${campo.rotulo}:** ${formatarValorCampo(campo, valor)}`);
    }
  }
  return blocos;
}

function blocosDeColecao(doc: ContentDoc, col: CollectionDef): string[] {
  const itens = ordenarItensParaExibicao(doc.itens, col);
  if (itens.length === 0) return [];
  const campoTitulo = col.campos.find((c) => c.nome === col.campoTitulo);
  const linhas = itens.map((item) => {
    const valorTitulo = item[col.campoTitulo];
    const titulo =
      campoTitulo && campoPreenchido(campoTitulo, valorTitulo)
        ? formatarValorCampo(campoTitulo, valorTitulo)
        : "(sem título)";
    const partes = col.campos
      .filter((c) => c.nome !== col.campoTitulo && campoPreenchido(c, item[c.nome]))
      // Texto longo vira uma linha só, para não quebrar a lista.
      .map((c) => `${c.rotulo}: ${formatarValorCampo(c, item[c.nome]).replace(/\s*\n+\s*/g, " ")}`);
    return `- **${titulo.replace(/\s*\n+\s*/g, " ")}**${partes.length ? ` — ${partes.join(" · ")}` : ""}`;
  });
  const blocos = [`#### ${col.rotulo} (${itens.length})`, linhas.join("\n")];
  const resumos = calcularResumos(doc, col);
  if (resumos.length > 0) {
    blocos.push(`Resumo: ${resumos.map((r) => `${r.rotulo}: ${formatarResumo(r)}`).join(" · ")}`);
  }
  return blocos;
}

/** Blocos de um documento (título, status, campos, coleções, notas). */
function blocosDoDocumento(doc: ContentDoc, def: PageDefinition): string[] {
  const blocos = [`### ${doc.titulo} (\`${doc.id}\`)`, linhaDeStatus(doc)];
  const corpo = doc.corpo.trim();
  if (calcularCompletude(doc, def).preenchidos === 0 && corpo === "") {
    blocos.push("_(sem conteúdo)_");
    return blocos;
  }
  blocos.push(...blocosDeCampos(doc, def));
  for (const col of def.colecoes ?? []) blocos.push(...blocosDeColecao(doc, col));
  if (corpo !== "") {
    blocos.push("#### Notas", rebaixarHeadings(corpo).replace(/\n{3,}/g, "\n\n"));
  }
  return blocos;
}

/**
 * Gera o Markdown consolidado dos documentos (agrupados por seção, na ordem da navegação).
 * `defs` pode trazer só as definições dos documentos recebidos; faltantes vêm do registro.
 */
export function exportarMarkdown(
  docs: readonly ContentDoc[],
  defs: Partial<Record<DocId, PageDefinition>> = {},
  geradoEm: string = new Date().toISOString(),
): string {
  const n = docs.length;
  const blocos: string[] = [
    "# BusinessOS — contexto do negócio",
    `> Estágio: ${ROTULO_ESTAGIO[ESTAGIO_ATUAL]} · Gerado em ${geradoEm} · ${n} ${n === 1 ? "documento" : "documentos"}`,
  ];
  for (const secao of NAVEGACAO) {
    const daSecao = docs.filter((d) => d.secao === secao.slug);
    if (daSecao.length === 0) continue;
    blocos.push(`## ${secao.titulo}`);
    for (const doc of daSecao) blocos.push(...blocosDoDocumento(doc, defs[doc.id] ?? obterDefinicao(doc.id)));
  }
  return `${blocos.join("\n\n")}\n`;
}
