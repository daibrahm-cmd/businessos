// src/lib/content/serializacao.ts
// Leitura e escrita do formato .md (front matter YAML + notas): normalização, validação e ordem canônica de chaves.
import matter from "gray-matter";
import { ErroConteudo, detalhesDoZod, type DetalheErro } from "@/lib/content/errors";
import { ESTAGIO_ATUAL } from "@/lib/content/navigation";
import {
  criarSchemaDocumento,
  criarSchemaItemCompleto,
  valorPadrao,
} from "@/lib/content/schemas/build";
import { obterColecao } from "@/lib/content/schemas";
import type { PageDefinition } from "@/lib/content/schemas/field-types";
import type { ContentDoc, Item, ValorCampo } from "@/lib/content/types";

/** Chaves do front matter na ordem canônica de gravação (§3.1). */
export const CHAVES_CANONICAS = [
  "id",
  "secao",
  "pagina",
  "titulo",
  "descricao",
  "estagio",
  "status",
  "atualizado_em",
  "atualizado_por",
  "tags",
  "relacionados",
  "campos",
  "itens",
] as const;

const CHAVES_RESERVADAS = new Set<string>([...CHAVES_CANONICAS, "corpo", "extras"]);

/** Chaves que, vazias no YAML (null), são tratadas como ausentes para cair no valor padrão. */
const CHAVES_TOLERAM_NULL = ["tags", "relacionados", "campos", "itens"] as const;

type Registro = Record<string, unknown>;

function ehObjeto(v: unknown): v is Registro {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);
}

/**
 * Normaliza o corpo Markdown: \r\n → \n, sem linhas em branco no começo,
 * sem espaços no fim e com exatamente um \n final (ou "" se vazio).
 */
export function normalizarCorpo(corpo: string): string {
  const texto = corpo.replace(/\r\n?/g, "\n").replace(/^(?:[ \t]*\n)+/, "").trimEnd();
  return texto === "" ? "" : `${texto}\n`;
}

/** Separa as chaves conhecidas do front matter das desconhecidas (que viram `extras`). */
function montarDocumento(dados: Registro, corpo: string): ContentDoc {
  const extras: Registro = {};
  for (const [chave, valor] of Object.entries(dados)) {
    if (!CHAVES_RESERVADAS.has(chave) && valor !== undefined) extras[chave] = valor;
  }
  return {
    id: dados.id,
    secao: dados.secao,
    pagina: dados.pagina,
    titulo: dados.titulo,
    descricao: dados.descricao,
    estagio: dados.estagio,
    status: dados.status,
    atualizado_em: dados.atualizado_em,
    atualizado_por: dados.atualizado_por,
    tags: dados.tags,
    relacionados: dados.relacionados,
    campos: dados.campos,
    itens: dados.itens,
    corpo: normalizarCorpo(corpo),
    extras,
  } as ContentDoc;
}

/** Confere se id/secao/pagina do arquivo batem com a página esperada (o caminho do arquivo). */
function conferirIdentidade(dados: Registro, def: PageDefinition): DetalheErro[] {
  const detalhes: DetalheErro[] = [];
  if (dados.id !== def.id) {
    detalhes.push({ caminho: "id", mensagem: `O id do arquivo não corresponde ao caminho (esperado ${def.id}).` });
  }
  if (dados.secao !== def.secao) {
    detalhes.push({ caminho: "secao", mensagem: `A seção do arquivo não corresponde ao caminho (esperado ${def.secao}).` });
  }
  if (dados.pagina !== def.pagina) {
    detalhes.push({ caminho: "pagina", mensagem: `A página do arquivo não corresponde ao caminho (esperado ${def.pagina}).` });
  }
  return detalhes;
}

/**
 * Lê o texto de um arquivo .md da página `def` e devolve o documento normalizado.
 * Erros de YAML ou de schema → ErroConteudo CONTEUDO_INVALIDO com detalhes.
 */
export function desserializar(conteudo: string, def: PageDefinition): ContentDoc {
  const mensagem = `O arquivo content/${def.id}.md tem erros.`;
  let arquivo: matter.GrayMatterFile<string>;
  try {
    // Sempre com objeto de opções: sem ele o gray-matter usa cache global e devolve objetos compartilhados.
    arquivo = matter(conteudo.replace(/^﻿/, ""), {});
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message.split("\n")[0] : String(erro);
    throw new ErroConteudo("CONTEUDO_INVALIDO", mensagem, [{ caminho: "", mensagem: `YAML inválido: ${motivo}` }]);
  }

  const bruto: unknown = structuredClone(arquivo.data);
  if (!ehObjeto(bruto)) {
    throw new ErroConteudo("CONTEUDO_INVALIDO", mensagem, [{ caminho: "", mensagem: "Front matter ausente ou inválido." }]);
  }
  const dados: Registro = bruto;
  for (const chave of CHAVES_TOLERAM_NULL) {
    if (dados[chave] === null) delete dados[chave];
  }
  if (dados.atualizado_em instanceof Date) dados.atualizado_em = dados.atualizado_em.toISOString();

  const detalhes = conferirIdentidade(dados, def);
  const resultado = criarSchemaDocumento(def).safeParse(dados);
  if (!resultado.success) detalhes.push(...detalhesDoZod(resultado.error.issues));
  if (detalhes.length > 0 || !resultado.success) {
    throw new ErroConteudo("CONTEUDO_INVALIDO", mensagem, detalhes);
  }
  return montarDocumento(resultado.data as Registro, arquivo.content);
}

/** Ordena um item: id, colecao, campos na ordem da definição, extras do item no fim. */
function ordenarItem(item: Item, def: PageDefinition): Registro {
  const col = obterColecao(def, item.colecao);
  const saida: Registro = { id: item.id, colecao: item.colecao };
  for (const c of col?.campos ?? []) saida[c.nome] = item[c.nome] ?? valorPadrao(c);
  for (const [chave, valor] of Object.entries(item)) {
    if (!(chave in saida) && valor !== undefined) saida[chave] = valor;
  }
  return saida;
}

/** Monta o objeto do front matter na ordem canônica (§3.1), preenchendo valores vazios explicitamente. */
export function montarFrontmatter(doc: ContentDoc, def: PageDefinition): Registro {
  const campos: Record<string, ValorCampo | unknown> = {};
  for (const c of def.campos) campos[c.nome] = doc.campos[c.nome] ?? valorPadrao(c);
  for (const [chave, valor] of Object.entries(doc.campos)) {
    if (!(chave in campos) && valor !== undefined) campos[chave] = valor;
  }
  const dados: Registro = {
    id: doc.id,
    secao: doc.secao,
    pagina: doc.pagina,
    titulo: doc.titulo,
    descricao: doc.descricao,
    estagio: doc.estagio,
    status: doc.status,
    atualizado_em: doc.atualizado_em,
    atualizado_por: doc.atualizado_por,
    tags: doc.tags,
    relacionados: doc.relacionados,
    campos,
    itens: doc.itens.map((item) => ordenarItem(item, def)),
  };
  for (const [chave, valor] of Object.entries(doc.extras ?? {})) {
    if (!CHAVES_RESERVADAS.has(chave) && valor !== undefined) dados[chave] = valor;
  }
  return dados;
}

/** Gera o texto .md canônico do documento (não valida; use normalizarParaGravar antes). */
export function serializar(doc: ContentDoc, def: PageDefinition): string {
  const frontmatter = matter.stringify("", montarFrontmatter(doc, def)).replace(/\n+$/, "\n");
  const corpo = normalizarCorpo(doc.corpo);
  return corpo === "" ? frontmatter : `${frontmatter}\n${corpo}`;
}

/**
 * Prepara um documento para gravação: sobrescreve os campos do sistema (vindos da definição),
 * valida com o schema da página e com `criarSchemaItemCompleto` por item, e devolve a forma normalizada.
 * Falha → ErroConteudo PAYLOAD_INVALIDO com detalhes.
 */
export function normalizarParaGravar(doc: ContentDoc, def: PageDefinition): ContentDoc {
  const corrigido: ContentDoc = {
    ...doc,
    id: def.id,
    secao: def.secao,
    pagina: def.pagina,
    titulo: def.titulo,
    descricao: def.descricao,
    estagio: ESTAGIO_ATUAL,
  };
  const dados = montarFrontmatter(corrigido, def);
  const resultado = criarSchemaDocumento(def).safeParse(dados);
  const detalhes: DetalheErro[] = resultado.success ? [] : detalhesDoZod(resultado.error.issues);

  let normalizado: Registro | undefined;
  if (resultado.success) {
    normalizado = resultado.data as Registro;
    const itens = (normalizado.itens as Item[]).map((item, i) => {
      const col = obterColecao(def, item.colecao);
      if (!col) {
        detalhes.push({ caminho: `itens.${i}.colecao`, mensagem: `Coleção inexistente: ${item.colecao}.` });
        return item;
      }
      const r = criarSchemaItemCompleto(col).safeParse(item);
      if (r.success) return r.data;
      detalhes.push(
        ...detalhesDoZod(r.error.issues.map((issue) => ({ ...issue, path: ["itens", i, ...issue.path] }))),
      );
      return item;
    });
    normalizado = { ...normalizado, itens };
  }

  if (detalhes.length > 0 || !normalizado) {
    throw new ErroConteudo("PAYLOAD_INVALIDO", `Dados inválidos para a página ${def.id}.`, detalhes);
  }
  return montarDocumento(normalizado, corrigido.corpo);
}
