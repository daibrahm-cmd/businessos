// src/lib/content/fs-repository.ts
// Repositório da Fase 1: um arquivo content/<secao>/<pagina>.md por documento, com escrita atômica.
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ErroConteudo, type DetalheErro } from "@/lib/content/errors";
import { DOC_IDS, ehIdValido, separarId } from "@/lib/content/navigation";
import { criarTemplate } from "@/lib/content/schemas/build";
import { obterDefinicao } from "@/lib/content/schemas";
import { desserializar, normalizarParaGravar, serializar } from "@/lib/content/serializacao";
import type { ContentRepository } from "@/lib/content/repository";
import type { ContentDoc, DocId } from "@/lib/content/types";

/** Pasta de conteúdo: BUSINESSOS_CONTENT_DIR ou ./content, sempre absoluta. */
export function resolverRaizConteudo(raiz?: string): string {
  // turbopackIgnore: o caminho só é conhecido em tempo de execução; sem isso o Turbopack
  // rastreia o projeto inteiro para o bundle do servidor. Não muda o comportamento.
  return path.resolve(/*turbopackIgnore: true*/ raiz || process.env.BUSINESSOS_CONTENT_DIR || path.join(process.cwd(), "content"));
}

function codigoDoErro(erro: unknown): string | undefined {
  return typeof erro === "object" && erro !== null && "code" in erro ? String(erro.code) : undefined;
}

export class FileSystemContentRepository implements ContentRepository {
  /** Pasta raiz absoluta do conteúdo. */
  readonly raiz: string;

  constructor(opcoes: { raiz?: string } = {}) {
    this.raiz = resolverRaizConteudo(opcoes.raiz);
  }

  /**
   * Caminho seguro do arquivo de um id. Só aceita ids da navegação (bloqueia "..", "/", "%2e" etc.)
   * e confere que o caminho final fica dentro da raiz.
   */
  private caminhoDoArquivo(id: unknown): string {
    if (!ehIdValido(id)) throw new ErroConteudo("NAO_ENCONTRADO", "Documento não encontrado.");
    const { secao, pagina } = separarId(id);
    const alvo = path.resolve(this.raiz, secao, `${pagina}.md`);
    if (!alvo.startsWith(this.raiz + path.sep)) {
      throw new ErroConteudo("NAO_ENCONTRADO", "Documento não encontrado.");
    }
    return alvo;
  }

  /** Verdadeiro se o arquivo do documento existe em disco (usado pelo seed; não faz parte da interface). */
  async existe(id: DocId): Promise<boolean> {
    try {
      await fs.access(this.caminhoDoArquivo(id));
      return true;
    } catch (erro) {
      if (erro instanceof ErroConteudo) throw erro;
      return false;
    }
  }

  async get(id: DocId): Promise<ContentDoc> {
    const alvo = this.caminhoDoArquivo(id);
    const def = obterDefinicao(id);
    let conteudo: string;
    try {
      conteudo = await fs.readFile(alvo, "utf8");
    } catch (erro) {
      // Arquivo ausente: o documento existe logicamente, vazio. Leitura não grava nada.
      if (codigoDoErro(erro) === "ENOENT") return criarTemplate(def);
      throw erro;
    }
    return desserializar(conteudo, def);
  }

  async list(): Promise<ContentDoc[]> {
    const resultados = await Promise.allSettled(DOC_IDS.map((id) => this.get(id)));
    const detalhes: DetalheErro[] = [];
    const docs: ContentDoc[] = [];
    resultados.forEach((r, i) => {
      if (r.status === "fulfilled") {
        docs.push(r.value);
        return;
      }
      const erro: unknown = r.reason;
      if (erro instanceof ErroConteudo && erro.codigo === "CONTEUDO_INVALIDO") {
        for (const d of erro.detalhes ?? []) {
          detalhes.push({ caminho: d.caminho ? `${DOC_IDS[i]}: ${d.caminho}` : DOC_IDS[i], mensagem: d.mensagem });
        }
        return;
      }
      throw erro;
    });
    if (detalhes.length > 0) {
      throw new ErroConteudo("CONTEUDO_INVALIDO", "Há arquivos de conteúdo inválidos.", detalhes);
    }
    return docs;
  }

  async save(doc: ContentDoc): Promise<ContentDoc> {
    const alvo = this.caminhoDoArquivo(doc.id);
    const def = obterDefinicao(doc.id);
    const normalizado = normalizarParaGravar(doc, def);
    const texto = serializar(normalizado, def);

    const dir = path.dirname(alvo);
    const tmp = path.join(dir, `.${def.pagina}.md.${process.pid}.${randomUUID()}.tmp`);
    // Nome único (pid + uuid): a limpeza nunca apaga arquivo de outra escrita.
    let tentouTmp = false;
    try {
      await fs.mkdir(dir, { recursive: true });
      tentouTmp = true;
      await fs.writeFile(tmp, texto, { encoding: "utf8", flag: "wx" });
      await fs.rename(tmp, alvo);
    } catch (erro) {
      if (tentouTmp) await fs.rm(tmp, { force: true });
      const codigo = codigoDoErro(erro);
      if (codigo === "EROFS" || codigo === "EACCES" || codigo === "EPERM") {
        throw new ErroConteudo(
          "ERRO_INTERNO",
          "Não foi possível gravar: armazenamento somente leitura ou sem permissão.",
        );
      }
      throw erro;
    }
    return normalizado;
  }
}
