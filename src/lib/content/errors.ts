// src/lib/content/errors.ts
// Erros de domínio do conteúdo, com código estável usado pela API e pelas Server Actions.
export type CodigoErro =
  | "JSON_INVALIDO"
  | "PAYLOAD_INVALIDO"
  | "PAYLOAD_GRANDE"
  | "TIPO_NAO_SUPORTADO"
  | "FORMATO_INVALIDO"
  | "NAO_AUTORIZADO"
  | "PROIBIDO"
  | "NAO_ENCONTRADO"
  | "CONFLITO"
  | "CONTEUDO_INVALIDO"
  | "ERRO_INTERNO";

export const STATUS_HTTP: Record<CodigoErro, number> = {
  JSON_INVALIDO: 400,
  PAYLOAD_INVALIDO: 400,
  FORMATO_INVALIDO: 400,
  NAO_AUTORIZADO: 401,
  PROIBIDO: 403,
  NAO_ENCONTRADO: 404,
  CONFLITO: 409,
  PAYLOAD_GRANDE: 413,
  TIPO_NAO_SUPORTADO: 415,
  CONTEUDO_INVALIDO: 422,
  ERRO_INTERNO: 500,
};

export interface DetalheErro {
  /** Caminho do campo com problema, ex.: "campos.preco" ou "itens.2.nome". */
  caminho: string;
  mensagem: string;
}

export class ErroConteudo extends Error {
  constructor(
    public readonly codigo: CodigoErro,
    mensagem: string,
    public readonly detalhes?: DetalheErro[],
    /** Documento atual, enviado junto em CONFLITO. */
    public readonly documentoAtual?: unknown,
  ) {
    super(mensagem);
    this.name = "ErroConteudo";
  }
}

/** Converte issues do zod em DetalheErro[] (mensagens em PT-BR já vêm dos schemas). */
export function detalhesDoZod(issues: { path: PropertyKey[]; message: string }[]): DetalheErro[] {
  return issues.map((issue) => ({
    // Junta o caminho com ponto ("itens.2.nome"); símbolos viram sua descrição.
    caminho: issue.path
      .map((parte) => (typeof parte === "symbol" ? (parte.description ?? "") : String(parte)))
      .join("."),
    mensagem: issue.message,
  }));
}
