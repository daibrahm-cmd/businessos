// src/lib/content/types.ts
// Tipos públicos do conteúdo, compartilhados por UI, API e repositórios.
import type { DocId, Estagio, SecaoSlug } from "@/lib/content/navigation";
import type { STATUS } from "@/lib/content/schemas/base";

export type { DocId, Estagio, SecaoSlug } from "@/lib/content/navigation";
export type Status = (typeof STATUS)[number];
export type Autor = "humano" | `agente:${string}`;

/** Valor de um campo: texto, número/moeda, lista de textos, opção/data, ou vazio (null). */
export type ValorCampo = string | number | string[] | null;

export interface Item {
  id: string;
  colecao: string;
  [campo: string]: ValorCampo;
}

/** Documento completo = front matter + corpo. É o formato do JSON da API. */
export interface ContentDoc {
  id: DocId;
  secao: SecaoSlug;
  pagina: string;
  titulo: string;
  descricao: string;
  estagio: Estagio;
  status: Status;
  atualizado_em: string;
  atualizado_por: Autor;
  tags: string[];
  relacionados: DocId[];
  campos: Record<string, ValorCampo>;
  itens: Item[];
  /** Corpo Markdown (notas livres). */
  corpo: string;
  /** Chaves desconhecidas do front matter, preservadas na gravação. Sempre presente ({} se nenhuma). */
  extras: Record<string, unknown>;
}

/** Alteração parcial de um documento (usada pela UI e pela API). Ver regras de merge em §5.4. */
export interface DocPatch {
  campos?: Record<string, ValorCampo>;
  itens?: Array<Partial<Item> & { colecao: string }>;
  itens_remover?: string[];
  corpo?: string;
  corpo_anexar?: string;
  status?: Status;
  tags?: string[];
  relacionados?: DocId[];
}

export type ModoVisualizacao = "grade" | "lista";

export interface Completude {
  preenchidos: number;
  total: number;
  /** 0–100, inteiro (Math.round). */
  percentual: number;
}

export interface ResumoCalculado {
  rotulo: string;
  valor: number;
  formato: "moeda" | "numero";
}
