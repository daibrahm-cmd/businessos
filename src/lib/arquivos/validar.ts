// src/lib/arquivos/validar.ts
// Lógica pura (sem I/O): valida o arquivo, sanitiza o nome e monta o caminho no Storage.
import { randomUUID } from "node:crypto";
import { LIMITE_BYTES, TIPOS_PERMITIDOS, type MimePermitido } from "@/lib/arquivos/tipos";

export type CodigoErroArquivo =
  | "VAZIO"
  | "TAMANHO_EXCEDIDO"
  | "TIPO_NAO_PERMITIDO"
  | "EXTENSAO_INVALIDA"
  | "NOME_INVALIDO"
  | "NAO_ENCONTRADO"
  | "FALHA_ENVIO"
  | "FALHA_LEITURA"
  | "FALHA_REMOCAO"
  | "FALHA_URL";

/** Erro tipado com mensagem em português, segura para exibir (sem detalhes internos). */
export class ErroArquivo extends Error {
  constructor(
    readonly codigo: CodigoErroArquivo,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroArquivo";
  }
}

const MAX_NOME = 80;

/** Separa nome-base e extensão (minúscula, sem ponto) do último ponto. */
function separarExtensao(nome: string): { base: string; ext: string } {
  // Só o último segmento: descarta qualquer diretório (/ ou \) para evitar path traversal.
  const limpo = nome.split(/[\\/]/).pop() ?? "";
  const i = limpo.lastIndexOf(".");
  if (i <= 0) return { base: limpo, ext: "" };
  return { base: limpo.slice(0, i), ext: limpo.slice(i + 1).toLowerCase() };
}

/**
 * Sanitiza o nome: remove diretórios, tira acentos, troca espaços/símbolos por hífen,
 * bloqueia "." e ".." e limita o tamanho. Mantém a extensão (minúscula).
 */
export function sanitizarNome(nomeOriginal: string): string {
  const { base, ext } = separarExtensao(nomeOriginal.normalize("NFC"));
  const baseLimpa = base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^A-Za-z0-9._-]+/g, "-") // espaços e símbolos viram hífen
    .replace(/\.{2,}/g, ".") // sem ".." em sequência
    .replace(/^[-.]+|[-.]+$/g, "") // sem hífen/ponto nas pontas
    .replace(/-{2,}/g, "-")
    .slice(0, MAX_NOME);
  const extLimpa = ext.replace(/[^a-z0-9]/g, "");
  if (!baseLimpa) throw new ErroArquivo("NOME_INVALIDO", "O nome do arquivo é inválido.");
  return extLimpa ? `${baseLimpa}.${extLimpa}` : baseLimpa;
}

export interface EntradaValidacao {
  name: string;
  type: string;
  size: number;
}

export interface ArquivoValidado {
  mime: MimePermitido;
  nomeSanitizado: string;
  tamanho: number;
}

/** Valida mime, extensão (coerente com o mime) e tamanho. Lança ErroArquivo. */
export function validarArquivo(entrada: EntradaValidacao): ArquivoValidado {
  if (!entrada.size || entrada.size <= 0) throw new ErroArquivo("VAZIO", "O arquivo está vazio.");
  if (entrada.size > LIMITE_BYTES) {
    throw new ErroArquivo("TAMANHO_EXCEDIDO", "O arquivo passa do limite de 25 MB.");
  }
  const mime = entrada.type.toLowerCase().split(";")[0].trim();
  if (!Object.hasOwn(TIPOS_PERMITIDOS, mime)) {
    throw new ErroArquivo(
      "TIPO_NAO_PERMITIDO",
      "Tipo de arquivo não permitido. Use PNG, JPG, WEBP, GIF, PDF, TXT ou DOCX.",
    );
  }
  const permitido = mime as MimePermitido;
  const nomeSanitizado = sanitizarNome(entrada.name);
  const ext = nomeSanitizado.includes(".") ? nomeSanitizado.split(".").pop()! : "";
  const extensoes: readonly string[] = TIPOS_PERMITIDOS[permitido];
  if (!extensoes.includes(ext)) {
    throw new ErroArquivo("EXTENSAO_INVALIDA", "A extensão do arquivo não corresponde ao tipo declarado.");
  }
  return { mime: permitido, nomeSanitizado, tamanho: entrada.size };
}

/** Monta `<userId>/<uuid>-<nome>`. O uuid é injetável para testes. */
export function gerarCaminho(userId: string, nomeSanitizado: string, uuid: string = randomUUID()): string {
  if (!userId || /[\\/]/.test(userId)) throw new ErroArquivo("NOME_INVALIDO", "Usuário inválido.");
  return `${userId}/${uuid}-${nomeSanitizado}`;
}
