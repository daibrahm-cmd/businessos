// src/lib/content/schemas/field-types.ts
// Formato DECLARATIVO das páginas: a UI renderiza formulários a partir daqui
// e os schemas zod são derivados daqui (ver build.ts).
import type { DocId, SecaoSlug } from "@/lib/content/navigation";

export type TipoCampo =
  | "texto-curto"
  | "texto-longo"
  | "numero"
  | "moeda"
  | "lista-texto"
  | "selecao"
  | "data";

export interface OpcaoSelecao {
  /** Valor gravado no arquivo (kebab-case). */
  valor: string;
  /** Rótulo exibido na UI. */
  rotulo: string;
}

interface FieldDefBase {
  /** Chave em `campos` ou no item (snake_case, ^[a-z][a-z0-9_]*$). Não pode ser "id" nem "colecao". */
  nome: string;
  /** Rótulo PT-BR exibido no card/formulário. */
  rotulo: string;
  /** Texto de ajuda abaixo do rótulo (uma frase). */
  ajuda?: string;
  /** Placeholder do input. */
  placeholder?: string;
  /**
   * Só tem efeito em campos de ITENS de coleção: impede salvar o item com o campo vazio.
   * Campos de página nunca são obrigatórios (a página é preenchida aos poucos).
   */
  obrigatorio?: boolean;
}

export interface CampoTexto extends FieldDefBase {
  tipo: "texto-curto" | "texto-longo";
  /** Padrão: 200 (texto-curto) ou 5000 (texto-longo). */
  maxCaracteres?: number;
}

export interface CampoNumero extends FieldDefBase {
  tipo: "numero";
  min?: number;
  max?: number;
  /** Sufixo exibido após o número (ex.: "h", "meses", "%"). */
  unidade?: string;
  /** Padrão: false (aceita decimais). */
  inteiro?: boolean;
}

export interface CampoMoeda extends FieldDefBase {
  tipo: "moeda";
  /** Valor em reais (BRL), número com até 2 casas. Padrão: sem mínimo. */
  min?: number;
  max?: number;
}

export interface CampoLista extends FieldDefBase {
  tipo: "lista-texto";
  /** Padrão: 50 itens de até 300 caracteres. */
  maxItens?: number;
}

export interface CampoSelecao extends FieldDefBase {
  tipo: "selecao";
  /** Ao menos 2 opções; valores únicos. */
  opcoes: readonly OpcaoSelecao[];
}

export interface CampoData extends FieldDefBase {
  tipo: "data";
}

export type FieldDef =
  | CampoTexto
  | CampoNumero
  | CampoMoeda
  | CampoLista
  | CampoSelecao
  | CampoData;

/** Indicadores calculados sobre os itens de uma coleção (exibidos acima dos cards). */
export type ResumoDef =
  | {
      tipo: "contagem";
      rotulo: string;
      /** Conta só itens cujo campo selecao === valor. */
      filtro?: { campo: string; valor: string };
    }
  | {
      tipo: "soma";
      rotulo: string;
      /** Campo moeda ou numero somado. */
      campo: string;
      filtro?: { campo: string; valor: string };
    }
  | {
      tipo: "saldo";
      rotulo: string;
      /** Campo moeda com o valor do lançamento (sempre positivo). */
      campo: string;
      /** Campo selecao que diz se é entrada ou saída. */
      campoTipo: string;
      entrada: string;
      saida: string;
      /** Campo moeda de `campos` da PÁGINA somado ao saldo (ex.: saldo_inicial). */
      campoBase?: string;
      filtro?: { campo: string; valor: string };
    };

export interface CollectionDef {
  /** Nome da coleção (snake_case, plural). Gravado em item.colecao. */
  nome: string;
  /** Rótulo da coleção (plural), ex.: "Clientes". */
  rotulo: string;
  /** Rótulo de um item (singular), ex.: "Cliente". Usado em "Adicionar cliente". */
  rotuloItem: string;
  descricao?: string;
  /** Campos de cada item (4–8). */
  campos: readonly FieldDef[];
  /** Campo exibido como título do card (deve ser obrigatorio: true). */
  campoTitulo: string;
  /** Campo exibido como subtítulo do card. */
  campoSubtitulo?: string;
  /** Campo selecao exibido como badge no card. */
  campoDestaque?: string;
  /** Ordenação de exibição (não altera a ordem gravada). Padrão: ordem do arquivo. */
  ordenarPor?: { campo: string; direcao: "asc" | "desc" };
  resumos?: readonly ResumoDef[];
  /** Padrão: 500. */
  maxItens?: number;
}

export interface PageDefinition {
  id: DocId;
  secao: SecaoSlug;
  pagina: string;
  /** Copiados da navegação por definirPagina(). */
  titulo: string;
  descricao: string;
  /** Valor inicial de `relacionados` no template. */
  relacionadosPadrao: readonly DocId[];
  /** 4–8 campos de valor único. */
  campos: readonly FieldDef[];
  colecoes?: readonly CollectionDef[];
  /** Placeholder do editor de notas (corpo). */
  placeholderNotas?: string;
}
