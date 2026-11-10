// Testes da migração: parse → linhas do banco, idempotência e argumentos (cliente falso, sem rede).
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { criarTemplate } from "@/lib/content/schemas/build";
import { obterDefinicao } from "@/lib/content/schemas";
import { serializar } from "@/lib/content/serializacao";
import {
  idOportunidadeNoBanco,
  lerArgumentos,
  migrar,
  uuidEstavel,
  type DestinoMigracao,
  type Linha,
  type Tabela,
} from "./migrar-conteudo";

const USER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const agora = "2026-11-09T18:36:24.137Z";
let raiz: string;

async function escrever(rel: string, texto: string) {
  const alvo = path.join(raiz, rel);
  await fs.mkdir(path.dirname(alvo), { recursive: true });
  await fs.writeFile(alvo, texto, "utf8");
}

const opcoes = () => ({
  raizConteudo: path.join(raiz, "content"),
  arquivoOportunidades: path.join(raiz, "oportunidades", "oportunidades.json"),
  arquivoTarefas: path.join(raiz, "workflow", "tarefas.json"),
  userId: USER,
});

/** Destino falso que simula o upsert por chave de conflito (como o banco faria). */
function destinoFalso() {
  const tabelas: Record<Tabela, Map<string, Linha>> = { documentos: new Map(), oportunidades: new Map(), tarefas: new Map() };
  const destino: DestinoMigracao = {
    async upsert(tabela, linhas, conflito) {
      for (const l of linhas) tabelas[tabela].set(conflito.split(",").map((c) => String(l[c])).join("|"), l);
      return {};
    },
  };
  return { destino, tabelas };
}

beforeEach(async () => {
  raiz = await fs.mkdtemp(path.join(os.tmpdir(), "businessos-migra-"));
  const def = obterDefinicao("founder/objetivo");
  await escrever("content/founder/objetivo.md", serializar({ ...criarTemplate(def), atualizado_em: agora }, def));
  await escrever("content/founder/.omc/estado.md", "ignorar");
  await escrever("content/.omc/x.json", "{}");
  await escrever("content/founder/notas.txt", "ignorar");
  await escrever("content/direcao/oferta.md", "sem front matter");
  await escrever(
    "oportunidades/oportunidades.json",
    JSON.stringify({
      oportunidades: [
        { id: "c8a375f1", lead: "Ana", titulo: "Venda", estagio: "novo", criado_em: agora, atualizado_em: agora },
        { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", lead: "Rui", titulo: "Outra", estagio: "ganho", criado_em: agora, atualizado_em: agora },
        { id: "ruim", lead: "", titulo: "x", estagio: "novo", criado_em: agora, atualizado_em: agora },
      ],
    }),
  );
});

afterEach(async () => {
  await fs.rm(raiz, { recursive: true, force: true });
});

describe("ids de oportunidade", () => {
  it("preserva uuid e deriva de forma estável os demais", () => {
    expect(idOportunidadeNoBanco(USER, "BBBBBBBB-bbbb-4bbb-8bbb-bbbbbbbbbbbb")).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    const a = idOportunidadeNoBanco(USER, "c8a375f1");
    expect(a).toBe(uuidEstavel(USER, "c8a375f1"));
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(idOportunidadeNoBanco("outro", "c8a375f1")).not.toBe(a);
  });
});

describe("migrar", () => {
  it("simulação: conta, valida e não grava; ignora .omc e não-.md; tarefas ausentes = 0", async () => {
    const r = await migrar(opcoes());
    expect(r.documentos).toMatchObject({ lidos: 2, pulados: 1 });
    expect(r.documentos.erros[0]).toMatch(/direcao\/oferta/);
    expect(r.oportunidades).toMatchObject({ lidos: 3, pulados: 1 });
    expect(r.tarefas).toMatchObject({ lidos: 0, gravados: 0, pulados: 0, erros: [] });
  });

  it("monta as linhas do banco a partir do Markdown", async () => {
    const { destino, tabelas } = destinoFalso();
    await migrar({ ...opcoes(), destino });
    const doc = tabelas.documentos.get(`${USER}|founder/objetivo`)!;
    expect(doc).toMatchObject({ user_id: USER, secao: "founder", pagina: "objetivo", status: "vazio" });
    expect(Array.isArray(doc.tags)).toBe(true);
    expect(doc).toHaveProperty("campos");
    expect(doc).toHaveProperty("extras");
    const op = tabelas.oportunidades.get(uuidEstavel(USER, "c8a375f1"))!;
    expect(op).toMatchObject({ user_id: USER, criado_em: agora });
    expect((op.dados as { id: string }).id).toBe("c8a375f1");
  });

  it("é idempotente: rodar duas vezes não duplica linhas", async () => {
    const { destino, tabelas } = destinoFalso();
    await migrar({ ...opcoes(), destino });
    const tamanhos = () => Object.values(tabelas).map((t) => t.size);
    const primeira = tamanhos();
    const r2 = await migrar({ ...opcoes(), destino });
    expect(tamanhos()).toEqual(primeira);
    expect(primeira).toEqual([1, 2, 0]);
    expect(r2.oportunidades.gravados).toBe(2);
  });

  it("lê tarefas válidas quando o arquivo existe", async () => {
    await escrever(
      "workflow/tarefas.json",
      JSON.stringify({ tarefas: [{ id: "t1", agente: "founder-coach", titulo: "Rever", status: "fila", docs: [], criado_em: agora, atualizado_em: agora }] }),
    );
    const { destino, tabelas } = destinoFalso();
    const r = await migrar({ ...opcoes(), destino });
    expect(r.tarefas.gravados).toBe(1);
    expect(tabelas.tarefas.has(`${USER}|t1`)).toBe(true);
  });

  it("falha de gravação vira erro no relatório, sem lançar", async () => {
    const destino: DestinoMigracao = { upsert: async () => ({ erro: "boom" }) };
    const r = await migrar({ ...opcoes(), destino });
    expect(r.documentos.gravados).toBe(0);
    expect(r.documentos.erros.some((e) => e.includes("boom"))).toBe(true);
  });
});

describe("lerArgumentos", () => {
  it("padrão seguro: sem --aplicar não aplica", () => {
    expect(lerArgumentos(["--email=A@B.com"])).toEqual({ email: "a@b.com", aplicar: false });
    expect(lerArgumentos(["--aplicar"]).aplicar).toBe(true);
  });
  it("recusa conflito e argumento desconhecido", () => {
    expect(() => lerArgumentos(["--aplicar", "--dry-run"])).toThrow();
    expect(() => lerArgumentos(["--foo"])).toThrow();
  });
});
