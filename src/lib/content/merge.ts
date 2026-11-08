// src/lib/content/merge.ts
// Aplica um patch (já validado) a um documento. O que não foi enviado é preservado (§5.4).
import { ErroConteudo, detalhesDoZod, type DetalheErro } from "@/lib/content/errors";
import { LIMITES, criarSchemaItemCompleto, valorPadrao } from "@/lib/content/schemas/build";
import { obterCampo, obterColecao } from "@/lib/content/schemas";
import type { PageDefinition } from "@/lib/content/schemas/field-types";
import type { ContentDoc, DocPatch, Item, ValorCampo } from "@/lib/content/types";

/** Gera um id de item de 10 caracteres que não colide com os existentes (crypto global: Node e navegador). */
export function gerarIdItem(existentes: ReadonlySet<string>): string {
  for (;;) {
    const id = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
    if (!existentes.has(id)) return id;
  }
}

function erroPatch(id: string, detalhes: DetalheErro[]): ErroConteudo {
  return new ErroConteudo("PAYLOAD_INVALIDO", `Dados inválidos para a página ${id}.`, detalhes);
}

/** Copia só as chaves definidas (undefined = "não enviado"). */
function semIndefinidos<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Aplica o patch ao documento atual e devolve um NOVO documento (não altera `atual`).
 * Ordem: itens_remover → itens → campos → corpo/corpo_anexar → status/tags/relacionados.
 * Erros (coleção trocada, obrigatório vazio, limite de itens) → ErroConteudo PAYLOAD_INVALIDO.
 * `gerarId` pode ser injetado nos testes.
 */
export function aplicarPatch(
  atual: ContentDoc,
  patch: DocPatch,
  def: PageDefinition,
  gerarId: (existentes: ReadonlySet<string>) => string = gerarIdItem,
): ContentDoc {
  const novo = structuredClone(atual);

  // 1. Remoção (idempotente: ids inexistentes são ignorados).
  if (patch.itens_remover?.length) {
    const remover = new Set(patch.itens_remover);
    novo.itens = novo.itens.filter((item) => !remover.has(item.id));
  }

  // 2. Upsert de itens por id, na ordem enviada.
  if (patch.itens?.length) {
    const afetados = new Map<string, number>(); // id do item → índice no patch (para o caminho do erro)
    const detalhes: DetalheErro[] = [];

    patch.itens.forEach((parcial, indice) => {
      const col = obterColecao(def, parcial.colecao);
      if (!col) {
        detalhes.push({ caminho: `itens.${indice}.colecao`, mensagem: `Coleção inexistente: ${parcial.colecao}.` });
        return;
      }
      const valores = semIndefinidos(parcial);
      const posicao = parcial.id === undefined ? -1 : novo.itens.findIndex((i) => i.id === parcial.id);

      if (posicao >= 0) {
        const existente = novo.itens[posicao];
        if (existente.colecao !== parcial.colecao) {
          detalhes.push({
            caminho: `itens.${indice}.colecao`,
            mensagem: `Item ${existente.id} pertence à coleção ${existente.colecao}.`,
          });
          return;
        }
        novo.itens[posicao] = { ...existente, ...valores } as Item;
        afetados.set(existente.id, indice);
      } else {
        const id = parcial.id ?? gerarId(new Set(novo.itens.map((i) => i.id)));
        novo.itens.push({ ...valores, id, colecao: col.nome } as Item);
        afetados.set(id, indice);
      }
    });

    // Valida cada item afetado com o schema completo (aplica `obrigatorio` e preenche padrões).
    novo.itens = novo.itens.map((item) => {
      const indice = afetados.get(item.id);
      if (indice === undefined) return item;
      const col = obterColecao(def, item.colecao);
      if (!col) return item;
      const r = criarSchemaItemCompleto(col).safeParse(item);
      if (r.success) return r.data;
      detalhes.push(
        ...detalhesDoZod(r.error.issues.map((issue) => ({ ...issue, path: ["itens", indice, ...issue.path] }))),
      );
      return item;
    });

    // Limite de itens por coleção.
    for (const col of def.colecoes ?? []) {
      const max = col.maxItens ?? LIMITES.itensPorColecao;
      if (novo.itens.filter((i) => i.colecao === col.nome).length > max) {
        detalhes.push({ caminho: "itens", mensagem: `A coleção ${col.rotulo} aceita no máximo ${max} itens.` });
      }
    }

    if (detalhes.length > 0) throw erroPatch(def.id, detalhes);
  }

  // 3. Campos: merge raso por chave; null = limpar.
  if (patch.campos) {
    for (const [nome, valor] of Object.entries(patch.campos) as [string, ValorCampo | undefined][]) {
      if (valor === undefined) continue;
      const campo = obterCampo(def.campos, nome);
      novo.campos[nome] = valor === null && campo ? valorPadrao(campo) : valor;
    }
  }

  // 4. Corpo.
  if (patch.corpo !== undefined) {
    novo.corpo = patch.corpo;
  } else if (patch.corpo_anexar !== undefined) {
    const base = novo.corpo.trimEnd();
    novo.corpo = base + (novo.corpo.trim() ? "\n\n" : "") + patch.corpo_anexar.trim() + "\n";
  }

  // 5. Metadados editáveis: substituem o valor inteiro.
  if (patch.status !== undefined) novo.status = patch.status;
  if (patch.tags !== undefined) novo.tags = [...patch.tags];
  if (patch.relacionados !== undefined) novo.relacionados = [...patch.relacionados];

  return novo;
}
