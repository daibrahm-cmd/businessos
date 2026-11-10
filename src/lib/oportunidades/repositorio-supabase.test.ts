// Testes do backend Supabase das oportunidades, com cliente falso em memória.
import { describe, expect, it, vi } from "vitest";
import { BancoFalso, criarClienteFalso } from "@/lib/armazenamento/supabase-falso";
import {
  ErroOportunidades,
  lerOportunidades,
  removerOportunidade,
  salvarOportunidade,
  criarRepositorioOportunidadesSupabase,
} from "@/lib/oportunidades/repositorio";

const ANA = "11111111-1111-4111-8111-111111111111";
const BIA = "22222222-2222-4222-8222-222222222222";

function novo(userId = ANA, banco = new BancoFalso()) {
  const acesso = { cliente: criarClienteFalso(banco, userId), userId };
  return { banco, acesso, repo: criarRepositorioOportunidadesSupabase(acesso) };
}

describe("oportunidades no Supabase", () => {
  it("começa vazio, cria no estágio novo com id uuid e grava a linha com user_id", async () => {
    const { banco, repo } = novo();
    expect(await repo.ler()).toEqual([]);
    const o = await repo.salvar({ lead: "Ana", titulo: "Mentoria", valor: 1500 }, new Date("2026-01-01T10:00:00Z"));
    expect(o.estagio).toBe("novo");
    expect(o.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(banco.tabelas.oportunidades[0]).toMatchObject({ id: o.id, user_id: ANA });
    expect(await repo.ler()).toEqual([o]);
  });

  it("atualiza preservando o resto, limpa opcionais e mantém lead_id", async () => {
    const { repo } = novo();
    const o = await repo.salvar({ lead: "Ana", titulo: "M", valor: 10, empresa: "Acme", lead_id: "abc" }, new Date("2026-01-01T10:00:00Z"));
    const m = await repo.salvar({ id: o.id, estagio: "qualificado", valor: null, empresa: "" }, new Date("2026-01-02T10:00:00Z"));
    expect(m).toMatchObject({ estagio: "qualificado", lead: "Ana", lead_id: "abc", criado_em: o.criado_em });
    expect(m.valor).toBeUndefined();
    expect(m.empresa).toBeUndefined();
    expect(m.atualizado_em).toBe("2026-01-02T10:00:00.000Z");
    expect(await repo.ler()).toHaveLength(1);
  });

  it("erros: criar incompleto, id inexistente (inclusive não-uuid) e remover inexistente", async () => {
    const { repo } = novo();
    await expect(repo.salvar({ lead: "Ana" }, new Date())).rejects.toMatchObject({ codigo: "PAYLOAD_INVALIDO" });
    await expect(repo.salvar({ id: "nao-existe", estagio: "ganho" }, new Date())).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    await expect(repo.salvar({ id: ANA, estagio: "ganho" }, new Date())).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    await expect(repo.remover("x")).rejects.toBeInstanceOf(ErroOportunidades);
    const o = await repo.salvar({ lead: "Bia", titulo: "C" }, new Date());
    await repo.remover(o.id);
    expect(await repo.ler()).toEqual([]);
    await expect(repo.remover(o.id)).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
  });

  it("isola por userId (RLS e filtro explícito)", async () => {
    const banco = new BancoFalso();
    const ana = novo(ANA, banco).repo;
    const bia = novo(BIA, banco).repo;
    const o = await ana.salvar({ lead: "Ana", titulo: "A" }, new Date());
    await bia.salvar({ lead: "Bia", titulo: "B" }, new Date());
    expect((await ana.ler()).map((x) => x.lead)).toEqual(["Ana"]);
    expect((await bia.ler()).map((x) => x.lead)).toEqual(["Bia"]);
    await expect(bia.salvar({ id: o.id, estagio: "ganho" }, new Date())).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    await expect(bia.remover(o.id)).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    // Cliente admin (sem RLS): o filtro por user_id do código continua isolando.
    const admin = criarRepositorioOportunidadesSupabase({ cliente: criarClienteFalso(banco), userId: BIA });
    expect((await admin.ler()).map((x) => x.lead)).toEqual(["Bia"]);
    await expect(admin.remover(o.id)).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    expect(await ana.ler()).toHaveLength(1);
  });

  it("dado inválido no banco lança ARQUIVO_INVALIDO; falha do banco vira Error comum", async () => {
    const { banco, repo } = novo();
    banco.tabelas.oportunidades.push({ id: ANA, user_id: ANA, dados: { lead: "", estagio: "xx" }, criado_em: "x", atualizado_em: "x" });
    await expect(repo.ler()).rejects.toMatchObject({ codigo: "ARQUIVO_INVALIDO" });
    banco.falhas.oportunidades = "boom";
    await expect(repo.ler()).rejects.toThrow(/boom/);
  });

  it("gravações simultâneas não se perdem", async () => {
    const { repo } = novo();
    await Promise.all(["a", "b", "c", "d"].map((n) => repo.salvar({ lead: n, titulo: `T ${n}` }, new Date())));
    expect(await repo.ler()).toHaveLength(4);
  });

  it("a API pública usa o acesso injetado e o padrão é supabase (exige sessão)", async () => {
    const { acesso } = novo();
    const o = await salvarOportunidade({ lead: "Ana", titulo: "A" }, new Date(), { acesso });
    expect(await lerOportunidades({ acesso })).toEqual([o]);
    await removerOportunidade(o.id, { acesso });
    vi.stubEnv("BUSINESSOS_STORAGE", "");
    vi.stubEnv("BUSINESSOS_API_USER_ID", "");
    await expect(lerOportunidades({ origem: "api" })).rejects.toThrow(/BUSINESSOS_API_USER_ID/);
    vi.unstubAllEnvs();
  });
});
