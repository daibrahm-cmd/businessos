// src/lib/content/repository.ts
// Contrato de acesso ao conteúdo. A UI e a API só conhecem esta interface.
import { ErroConteudo } from "@/lib/content/errors";
import { FileSystemContentRepository, resolverRaizConteudo } from "@/lib/content/fs-repository";
import type { ContentDoc, DocId } from "@/lib/content/types";

export interface ContentRepository {
  /** Todos os documentos da navegação, na ordem da navegação (12). Ausentes vêm do template. */
  list(): Promise<ContentDoc[]>;
  /** Um documento. Id fora da navegação → ErroConteudo NAO_ENCONTRADO. Arquivo ausente → template. */
  get(id: DocId): Promise<ContentDoc>;
  /**
   * Grava o documento COMO RECEBIDO (sem merge; quem faz merge é o serviço).
   * Valida com o schema da página antes de gravar. Retorna o documento normalizado gravado.
   */
  save(doc: ContentDoc): Promise<ContentDoc>;
}

// Singleton por pasta de conteúdo: se BUSINESSOS_CONTENT_DIR mudar (testes), uma nova instância é criada.
let instancia: { raiz: string; repo: ContentRepository } | undefined;

/** Ponto único de troca de armazenamento (BUSINESSOS_STORAGE=fs | supabase). */
export function getContentRepository(): ContentRepository {
  const armazenamento = (process.env.BUSINESSOS_STORAGE?.trim() || "fs").toLowerCase();
  if (armazenamento === "supabase") {
    throw new ErroConteudo("ERRO_INTERNO", "Armazenamento Supabase ainda não implementado.");
  }
  if (armazenamento !== "fs") {
    throw new ErroConteudo("ERRO_INTERNO", `Armazenamento desconhecido: ${armazenamento}.`);
  }
  const raiz = resolverRaizConteudo();
  if (!instancia || instancia.raiz !== raiz) {
    instancia = { raiz, repo: new FileSystemContentRepository({ raiz }) };
  }
  return instancia.repo;
}
