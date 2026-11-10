// Testes do backend Supabase das tarefas, com cliente falso em memória.
import { describe, expect, it } from "vitest";
import { BancoFalso, criarClienteFalso } from "@/lib/armazenamento/supabase-falso";
import {
  criarRepositorioTarefasSupabase,
  ErroWorkflow,
  LIMITE_TAREFAS,
  lerTarefas,
  salvarTarefa,
} from "@/lib/workflow/repositorio";

const ANA = "11111111-1111-4111-8111-111111111111";
const BIA = "22222222-2222-4222-8222-222222222222";
const AG = "perfil-de-cliente-ideal";

function novo(userId = ANA, banco = new BancoFalso()) {
  const acesso = { cliente: criarClienteFalso(banco, userId), userId };
  return { banco, acesso, repo: criarRepositorioTarefasSupabase(acesso) };
}
const t = (n: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, n));

describe("tarefas no Supabase", () => {
  it("cria na fila, atualiza preservando o que não foi enviado e limpa a nota", async () => {
    const { banco, repo } = novo();
    expect(await repo.ler()).toEqual([]);
    const c = await repo.salvar({ agente: AG, titulo: "Descrever", docs: ["direcao/oferta"] }, t(1));
    expect(c.status).toBe("fila");
    expect(c.id).toHaveLength(8);
    expect(banco.tabelas.tarefas[0]).toMatchObject({ id: c.id, user_id: ANA });
    const a = await repo.salvar({ id: c.id, agente: AG, status: "trabalhando", nota: "ok" }, t(2));
    expect(a).toMatchObject({ titulo: "Descrever", docs: ["direcao/oferta"], status: "trabalhando", nota: "ok", criado_em: c.criado_em });
    const l = await repo.salvar({ id: c.id, agente: AG, nota: null }, t(3));
    expect(l.nota).toBeUndefined();
    expect(await repo.ler()).toHaveLength(1);
  });

  it("aceita id próprio ao criar; criar sem título e id inexistente falham", async () => {
    const { repo } = novo();
    expect((await repo.salvar({ id: "meu-id", agente: AG, titulo: "X" }, t(1))).id).toBe("meu-id");
    await expect(repo.salvar({ agente: AG }, t(1))).rejects.toMatchObject({ codigo: "PAYLOAD_INVALIDO" });
    await expect(repo.salvar({ id: "nao", agente: AG, status: "revisao" }, t(1))).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
  });

  it("isola por userId, inclusive ids iguais em donos diferentes", async () => {
    const banco = new BancoFalso();
    const ana = novo(ANA, banco).repo;
    const bia = novo(BIA, banco).repo;
    await ana.salvar({ id: "igual", agente: AG, titulo: "da Ana" }, t(1));
    await bia.salvar({ id: "igual", agente: AG, titulo: "da Bia" }, t(2));
    expect((await ana.ler())[0].titulo).toBe("da Ana");
    expect((await bia.ler())[0].titulo).toBe("da Bia");
    await bia.salvar({ id: "igual", agente: AG, status: "concluida" }, t(3));
    expect((await ana.ler())[0].status).toBe("fila");
    const admin = criarRepositorioTarefasSupabase({ cliente: criarClienteFalso(banco), userId: ANA });
    expect((await admin.ler()).map((x) => x.titulo)).toEqual(["da Ana"]);
  });

  it("acima do limite descarta as concluídas mais antigas e mantém as demais", async () => {
    const { banco, repo } = novo();
    // Pré-carrega LIMITE tarefas: as 3 mais antigas concluídas, o resto na fila.
    for (let i = 0; i < LIMITE_TAREFAS; i++) {
      const iso = t(i).toISOString();
      const dados = { id: `t${i}`, agente: AG, titulo: `T${i}`, status: i < 3 ? "concluida" : "fila", docs: [], criado_em: iso, atualizado_em: iso };
      banco.tabelas.tarefas.push({ user_id: ANA, id: `t${i}`, dados, criado_em: iso, atualizado_em: iso });
    }
    await repo.salvar({ agente: AG, titulo: "nova" }, t(1000));
    const ids = (await repo.ler()).map((x) => x.id);
    expect(ids).toHaveLength(LIMITE_TAREFAS);
    expect(ids).not.toContain("t0");
    expect(ids).toContain("t1");
    // Sem concluídas para descartar, passa do limite (mesmo comportamento do arquivo).
    await repo.salvar({ agente: AG, titulo: "outra" }, t(1001));
    await repo.salvar({ agente: AG, titulo: "mais uma" }, t(1002));
    expect((await repo.ler()).length).toBeGreaterThanOrEqual(LIMITE_TAREFAS);
  });

  it("dado inválido no banco lança ARQUIVO_INVALIDO; falha do banco vira Error comum", async () => {
    const { banco, repo } = novo();
    banco.tabelas.tarefas.push({ user_id: ANA, id: "ruim", dados: { titulo: "" }, criado_em: "x", atualizado_em: "x" });
    await expect(repo.ler()).rejects.toBeInstanceOf(ErroWorkflow);
    banco.tabelas.tarefas.length = 0;
    banco.falhas.tarefas = "boom";
    await expect(repo.salvar({ agente: AG, titulo: "x" }, t(1))).rejects.toThrow(/boom/);
  });

  it("salvamentos simultâneos não se perdem e a API pública usa o acesso injetado", async () => {
    const { acesso } = novo();
    await Promise.all(["A", "B", "C"].map((n) => salvarTarefa({ agente: AG, titulo: n }, new Date(), { acesso })));
    expect(await lerTarefas({ acesso })).toHaveLength(3);
  });
});
