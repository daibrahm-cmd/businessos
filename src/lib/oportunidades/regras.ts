// src/lib/oportunidades/regras.ts
// Regras de negócio das oportunidades, independentes de onde os dados são guardados (fs ou Supabase).
import type { EntradaOportunidade, Oportunidade } from "@/lib/oportunidades/tipos";

export class ErroOportunidades extends Error {
  constructor(
    readonly codigo: "NAO_ENCONTRADO" | "PAYLOAD_INVALIDO" | "ARQUIVO_INVALIDO",
    mensagem: string,
  ) {
    super(mensagem);
  }
}

/** Contrato dos dois backends. Cada um cuida da própria atomicidade/concorrência. */
export interface RepositorioOportunidades {
  ler(): Promise<Oportunidade[]>;
  salvar(entrada: EntradaOportunidade, agora: Date): Promise<Oportunidade>;
  remover(id: string): Promise<void>;
}

/** Texto vazio e `null` viram "ausente"; `undefined` mantém o valor atual. */
function aplicar<T>(novo: T | null | undefined, atual: T | undefined): T | undefined {
  if (novo === null || novo === "") return undefined;
  return novo === undefined ? atual : novo;
}

/**
 * Calcula a oportunidade resultante de criar (existente indefinido) ou atualizar.
 * Criar exige `lead` e `titulo`; `id` informado sem existente = NAO_ENCONTRADO.
 */
export function montarOportunidade(
  existente: Oportunidade | undefined,
  entrada: EntradaOportunidade,
  iso: string,
  gerarId: () => string,
): Oportunidade {
  if (existente) {
    return {
      ...existente,
      lead: entrada.lead ?? existente.lead,
      titulo: entrada.titulo ?? existente.titulo,
      estagio: entrada.estagio ?? existente.estagio,
      empresa: aplicar(entrada.empresa, existente.empresa),
      valor: aplicar(entrada.valor, existente.valor),
      contato: aplicar(entrada.contato, existente.contato),
      proximo_passo: aplicar(entrada.proximo_passo, existente.proximo_passo),
      lead_id: aplicar(entrada.lead_id, existente.lead_id),
      atualizado_em: iso,
    };
  }
  if (entrada.id) throw new ErroOportunidades("NAO_ENCONTRADO", `Oportunidade não encontrada: ${entrada.id}.`);
  if (!entrada.lead || !entrada.titulo) {
    throw new ErroOportunidades("PAYLOAD_INVALIDO", 'Para criar envie "lead" e "titulo".');
  }
  return {
    id: gerarId(),
    lead: entrada.lead,
    titulo: entrada.titulo,
    estagio: entrada.estagio ?? "novo",
    empresa: aplicar(entrada.empresa, undefined),
    valor: aplicar(entrada.valor, undefined),
    contato: aplicar(entrada.contato, undefined),
    proximo_passo: aplicar(entrada.proximo_passo, undefined),
    lead_id: aplicar(entrada.lead_id, undefined),
    criado_em: iso,
    atualizado_em: iso,
  };
}
