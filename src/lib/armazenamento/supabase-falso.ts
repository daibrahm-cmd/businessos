// src/lib/armazenamento/supabase-falso.ts
// Cliente Supabase falso, em memória, só para testes. Implementa o mínimo usado pelos repositórios:
// select/insert/update/upsert/delete + eq/in/order/maybeSingle, e emula o RLS "por dono".
import { randomUUID } from "node:crypto";
import type { ClienteSupabase } from "@/lib/armazenamento/acesso";

type Linha = Record<string, unknown>;
type Resposta = { data: unknown; error: { message: string; code?: string } | null };

/** Chaves primárias por tabela (oportunidades: id; tarefas: user_id + id). */
const CHAVES: Record<string, string[]> = { oportunidades: ["id"], tarefas: ["user_id", "id"] };

export class BancoFalso {
  tabelas: Record<string, Linha[]> = { oportunidades: [], tarefas: [] };
  /** Se definido, toda operação nesta tabela falha com esta mensagem. */
  falhas: Record<string, string> = {};
}

class Consulta implements PromiseLike<Resposta> {
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private carga: Linha = {};
  private opcoesUpsert: { onConflict?: string } = {};
  private filtros: Array<(l: Linha) => boolean> = [];
  private ordens: Array<{ coluna: string; asc: boolean }> = [];
  private retorna = true; // select puro sempre devolve; mutações só após .select()
  private unico = false;

  constructor(
    private banco: BancoFalso,
    private tabela: string,
    private userId: string | undefined, // definido = cliente "logado" (RLS ativo)
  ) {}

  select(): this {
    if (this.op !== "select") this.retorna = true;
    return this;
  }
  insert(linha: Linha): this {
    this.op = "insert";
    this.carga = linha;
    this.retorna = false;
    return this;
  }
  update(campos: Linha): this {
    this.op = "update";
    this.carga = campos;
    this.retorna = false;
    return this;
  }
  upsert(linha: Linha, opcoes: { onConflict?: string } = {}): this {
    this.op = "upsert";
    this.carga = linha;
    this.opcoesUpsert = opcoes;
    this.retorna = false;
    return this;
  }
  delete(): this {
    this.op = "delete";
    this.retorna = false;
    return this;
  }
  eq(coluna: string, valor: unknown): this {
    this.filtros.push((l) => l[coluna] === valor);
    return this;
  }
  in(coluna: string, valores: unknown[]): this {
    this.filtros.push((l) => valores.includes(l[coluna]));
    return this;
  }
  order(coluna: string, opcoes: { ascending?: boolean } = {}): this {
    this.ordens.push({ coluna, asc: opcoes.ascending ?? true });
    return this;
  }
  maybeSingle(): this {
    this.unico = true;
    return this;
  }

  then<R1 = Resposta, R2 = never>(
    ok?: ((v: Resposta) => R1 | PromiseLike<R1>) | null,
    falha?: ((e: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve().then(() => this.executar()).then(ok, falha);
  }

  private visiveis(): Linha[] {
    const todas = this.banco.tabelas[this.tabela] ?? [];
    return this.userId ? todas.filter((l) => l.user_id === this.userId) : todas;
  }

  private executar(): Resposta {
    const falha = this.banco.falhas[this.tabela];
    if (falha) return { data: null, error: { message: falha } };
    const tabela = (this.banco.tabelas[this.tabela] ??= []);
    const chaves = CHAVES[this.tabela] ?? ["id"];
    const mesmaChave = (a: Linha, b: Linha) => chaves.every((c) => a[c] === b[c]);
    const clonar = (l: Linha): Linha => structuredClone(l);
    const agora = new Date().toISOString();

    const preparar = (linha: Linha): Linha => {
      const nova = clonar(linha);
      if (this.tabela === "oportunidades") nova.id ??= randomUUID();
      nova.criado_em ??= agora;
      nova.atualizado_em ??= agora;
      return nova;
    };
    const negadoPeloRls = (l: Linha) => this.userId !== undefined && l.user_id !== this.userId;
    let afetadas: Linha[] = [];

    if (this.op === "insert" || this.op === "upsert") {
      const nova = preparar(this.carga);
      if (negadoPeloRls(nova)) {
        return { data: null, error: { message: "new row violates row-level security policy", code: "42501" } };
      }
      const i = tabela.findIndex((l) => mesmaChave(l, nova));
      if (i >= 0 && this.op === "insert") {
        return { data: null, error: { message: "duplicate key value violates unique constraint", code: "23505" } };
      }
      if (i >= 0) {
        if (negadoPeloRls(tabela[i])) {
          return { data: null, error: { message: "row-level security", code: "42501" } };
        }
        tabela[i] = { ...tabela[i], ...nova, criado_em: tabela[i].criado_em };
        afetadas = [tabela[i]];
      } else {
        tabela.push(nova);
        afetadas = [nova];
      }
    } else if (this.op === "update") {
      afetadas = this.visiveis().filter((l) => this.filtros.every((f) => f(l)));
      for (const l of afetadas) Object.assign(l, clonar(this.carga));
    } else if (this.op === "delete") {
      afetadas = this.visiveis().filter((l) => this.filtros.every((f) => f(l)));
      this.banco.tabelas[this.tabela] = tabela.filter((l) => !afetadas.includes(l));
    } else {
      afetadas = this.visiveis().filter((l) => this.filtros.every((f) => f(l)));
    }

    if (!this.retorna) return { data: null, error: null };
    const ordenadas = [...afetadas].sort((a, b) => {
      for (const { coluna, asc } of this.ordens) {
        const x = String(a[coluna] ?? "");
        const y = String(b[coluna] ?? "");
        if (x !== y) return (x < y ? -1 : 1) * (asc ? 1 : -1);
      }
      return 0;
    });
    const saida = ordenadas.map(clonar);
    return { data: this.unico ? (saida[0] ?? null) : saida, error: null };
  }
}

/** `userId` definido = cliente logado (RLS por dono). Sem `userId` = cliente admin (ignora RLS). */
export function criarClienteFalso(banco: BancoFalso, userId?: string): ClienteSupabase {
  return { from: (tabela: string) => new Consulta(banco, tabela, userId) } as unknown as ClienteSupabase;
}
