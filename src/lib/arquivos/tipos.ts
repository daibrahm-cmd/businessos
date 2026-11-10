// src/lib/arquivos/tipos.ts
// Constantes e schemas dos arquivos enviados ao Supabase Storage (bucket privado `arquivos`).
import { z } from "zod";

/** Limite por arquivo: 25 MB (o mesmo configurado no bucket). */
export const LIMITE_BYTES = 25 * 1024 * 1024;

/** Nome do bucket privado. */
export const BUCKET_ARQUIVOS = "arquivos";

/** Tipos aceitos: mime -> extensões válidas (minúsculas, sem ponto). */
export const TIPOS_PERMITIDOS = {
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "application/pdf": ["pdf"],
  "text/plain": ["txt"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
} as const satisfies Record<string, readonly string[]>;

export type MimePermitido = keyof typeof TIPOS_PERMITIDOS;

/** Linha da tabela public.arquivos já mapeada para camelCase. */
export const arquivoSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  caminho: z.string().min(1),
  nomeOriginal: z.string().min(1),
  mime: z.string().min(1),
  tamanho: z.number().int().nonnegative(),
  docId: z.string().nullable(),
  criadoEm: z.string(),
});
export type Arquivo = z.infer<typeof arquivoSchema>;

/** Linha crua vinda do banco (snake_case). `tamanho` bigint pode chegar como string. */
export const linhaArquivoSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  caminho: z.string().min(1),
  nome_original: z.string().min(1),
  mime: z.string().min(1),
  tamanho: z.coerce.number().int().nonnegative(),
  doc_id: z.string().nullable(),
  criado_em: z.string(),
});

/** Opções de envio/listagem. */
export const opcoesDocSchema = z.object({ docId: z.string().trim().min(1).max(200).optional() });
export type OpcoesDoc = z.infer<typeof opcoesDocSchema>;

export const idArquivoSchema = z.uuid();
