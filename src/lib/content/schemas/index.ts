// src/lib/content/schemas/index.ts
// Registro das 13 definições de página, indexadas pelo id da navegação.
import { ehIdValido, type DocId } from "@/lib/content/navigation";
import { ErroConteudo } from "@/lib/content/errors";
import type { CollectionDef, FieldDef, PageDefinition } from "@/lib/content/schemas/field-types";

import founderObjetivo from "./paginas/founder-objetivo";
import founderEstiloDeVida from "./paginas/founder-estilo-de-vida";
import direcaoMapaDeMercado from "./paginas/direcao-mapa-de-mercado";
import direcaoImaDeProblemas from "./paginas/direcao-ima-de-problemas";
import direcaoPerfilDeClienteIdeal from "./paginas/direcao-perfil-de-cliente-ideal";
import direcaoTeseDeValor from "./paginas/direcao-tese-de-valor";
import direcaoOferta from "./paginas/direcao-oferta";
import validacaoOferta from "./paginas/validacao-oferta";
import validacaoLeads from "./paginas/validacao-leads";
import validacaoPrimeirosClientes from "./paginas/validacao-primeiros-clientes";
import validacaoFluxoDeCaixa from "./paginas/validacao-fluxo-de-caixa";
import caixaFluxoDeCaixa from "./paginas/caixa-fluxo-de-caixa";
import caixaErp from "./paginas/caixa-erp";

/** As 13 definições, indexadas por id (o tipo garante uma por id da navegação). */
export const DEFINICOES: Readonly<Record<DocId, PageDefinition>> = {
  "founder/objetivo": founderObjetivo,
  "founder/estilo-de-vida": founderEstiloDeVida,
  "direcao/mapa-de-mercado": direcaoMapaDeMercado,
  "direcao/ima-de-problemas": direcaoImaDeProblemas,
  "direcao/perfil-de-cliente-ideal": direcaoPerfilDeClienteIdeal,
  "direcao/tese-de-valor": direcaoTeseDeValor,
  "direcao/oferta": direcaoOferta,
  "validacao/oferta": validacaoOferta,
  "validacao/leads": validacaoLeads,
  "validacao/primeiros-clientes": validacaoPrimeirosClientes,
  "validacao/fluxo-de-caixa": validacaoFluxoDeCaixa,
  "caixa/fluxo-de-caixa": caixaFluxoDeCaixa,
  "caixa/erp": caixaErp,
};

/** Definição de uma página. Nunca undefined para DocId válido; id inválido → NAO_ENCONTRADO. */
export function obterDefinicao(id: DocId): PageDefinition {
  if (!ehIdValido(id)) throw new ErroConteudo("NAO_ENCONTRADO", "Documento não encontrado.");
  return DEFINICOES[id];
}

/** Coleção da página pelo nome (undefined se não existir). */
export function obterColecao(def: PageDefinition, nome: string): CollectionDef | undefined {
  return def.colecoes?.find((c) => c.nome === nome);
}

/** Campo de uma lista de campos pelo nome (undefined se não existir). */
export function obterCampo(campos: readonly FieldDef[], nome: string): FieldDef | undefined {
  return campos.find((c) => c.nome === nome);
}

export type { CollectionDef, FieldDef, PageDefinition } from "@/lib/content/schemas/field-types";
