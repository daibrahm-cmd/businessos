// Cliente Supabase falso, em memória, só para os testes da base de conhecimento.
// Cobre o que indexar.ts e buscar.ts usam: select/eq/in/upsert/delete/maybeSingle e rpc.
import type { ClienteSupabase } from "@/lib/armazenamento/acesso"

type Linha = Record<string, unknown>
type Resposta = { data: unknown; error: { message: string } | null }

export class BancoConhecimento {
  tabelas: Record<string, Linha[]> = { conhecimento: [], mensagens: [] }
  /** Respostas da RPC buscar_conhecimento e parâmetros recebidos. */
  rpcResposta: Linha[] = []
  rpcChamadas: Array<{ nome: string; args: Record<string, unknown> }> = []
  upserts = 0
}

class Consulta implements PromiseLike<Resposta> {
  private op: "select" | "upsert" | "delete" = "select"
  private carga: Linha[] = []
  private filtros: Array<(l: Linha) => boolean> = []
  private unico = false

  constructor(
    private banco: BancoConhecimento,
    private tabela: string,
  ) {}

  select(): this {
    return this
  }
  upsert(linhas: Linha[]): this {
    this.op = "upsert"
    this.carga = linhas
    return this
  }
  delete(): this {
    this.op = "delete"
    return this
  }
  eq(coluna: string, valor: unknown): this {
    this.filtros.push((l) => l[coluna] === valor)
    return this
  }
  in(coluna: string, valores: unknown[]): this {
    this.filtros.push((l) => valores.includes(l[coluna]))
    return this
  }
  maybeSingle(): this {
    this.unico = true
    return this
  }

  then<R1 = Resposta, R2 = never>(
    ok?: ((v: Resposta) => R1 | PromiseLike<R1>) | null,
    falha?: ((e: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve().then(() => this.executar()).then(ok, falha)
  }

  private executar(): Resposta {
    const tabela = (this.banco.tabelas[this.tabela] ??= [])
    if (this.op === "upsert") {
      this.banco.upserts += 1
      for (const nova of this.carga) {
        const chave = (l: Linha) =>
          ["usuario_id", "origem_tipo", "origem_id", "trecho_indice"].every((c) => l[c] === nova[c])
        const i = tabela.findIndex(chave)
        if (i >= 0) tabela[i] = { ...tabela[i], ...structuredClone(nova) }
        else tabela.push(structuredClone(nova))
      }
      return { data: null, error: null }
    }
    const alvo = tabela.filter((l) => this.filtros.every((f) => f(l)))
    if (this.op === "delete") {
      this.banco.tabelas[this.tabela] = tabela.filter((l) => !alvo.includes(l))
      return { data: null, error: null }
    }
    const saida = alvo.map((l) => structuredClone(l))
    return { data: this.unico ? (saida[0] ?? null) : saida, error: null }
  }
}

export function criarClienteConhecimentoFalso(banco: BancoConhecimento): ClienteSupabase {
  return {
    from: (tabela: string) => new Consulta(banco, tabela),
    rpc: async (nome: string, args: Record<string, unknown>) => {
      banco.rpcChamadas.push({ nome, args })
      return { data: banco.rpcResposta, error: null }
    },
  } as unknown as ClienteSupabase
}
