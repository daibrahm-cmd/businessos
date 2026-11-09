// Testes do repositório de tarefas do Workflow e da situação dos agentes, com pasta temporária.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, GET } from "@/app/api/workflow/route";
import { listarAgentes, situacaoDosAgentes } from "@/lib/workflow/agentes";
import { ErroWorkflow, lerTarefas, salvarTarefa } from "@/lib/workflow/repositorio";

let pasta: string;

beforeEach(async () => {
  pasta = await fs.mkdtemp(path.join(os.tmpdir(), "businessos-wf-"));
  vi.stubEnv("BUSINESSOS_WORKFLOW_FILE", path.join(pasta, "workflow", "tarefas.json"));
  vi.stubEnv("BUSINESSOS_AGENTS_DIR", path.join(pasta, "agents"));
  vi.stubEnv("BUSINESSOS_API_TOKEN", "");
  vi.stubEnv("NODE_ENV", "test");
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(pasta, { recursive: true, force: true });
});

const post = (corpo: unknown, tipo = "application/json") =>
  POST(
    new Request("http://127.0.0.1:3000/api/workflow", {
      method: "POST",
      headers: { "Content-Type": tipo },
      body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
    }),
  );

describe("repositório", () => {
  it("sem arquivo, o quadro é vazio", async () => {
    expect(await lerTarefas()).toEqual([]);
  });

  it("cria na fila por padrão e atualiza preservando o que não foi enviado", async () => {
    const criada = await salvarTarefa({ agente: "perfil-de-cliente-ideal", titulo: "Descrever cliente", docs: ["direcao/oferta"] });
    expect(criada.status).toBe("fila");
    const atualizada = await salvarTarefa({ id: criada.id, agente: "perfil-de-cliente-ideal", status: "trabalhando", nota: "ok" });
    expect(atualizada).toMatchObject({ titulo: "Descrever cliente", docs: ["direcao/oferta"], status: "trabalhando", nota: "ok" });
    const limpa = await salvarTarefa({ id: criada.id, agente: "perfil-de-cliente-ideal", nota: null });
    expect(limpa.nota).toBeUndefined();
    expect(await lerTarefas()).toHaveLength(1);
  });

  it("criar sem título e atualizar id inexistente falham", async () => {
    await expect(salvarTarefa({ agente: "perfil-de-cliente-ideal" })).rejects.toMatchObject({ codigo: "PAYLOAD_INVALIDO" });
    await expect(salvarTarefa({ id: "nao-existe", agente: "perfil-de-cliente-ideal", status: "revisao" })).rejects.toMatchObject({
      codigo: "NAO_ENCONTRADO",
    });
  });

  it("dois salvamentos simultâneos não se perdem", async () => {
    await Promise.all([
      salvarTarefa({ agente: "perfil-de-cliente-ideal", titulo: "A" }),
      salvarTarefa({ agente: "fluxo-de-caixa", titulo: "B" }),
      salvarTarefa({ agente: "resumo", titulo: "C" }),
    ]);
    expect(await lerTarefas()).toHaveLength(3);
  });

  it("arquivo corrompido lança ARQUIVO_INVALIDO", async () => {
    await fs.mkdir(path.join(pasta, "workflow"));
    await fs.writeFile(path.join(pasta, "workflow", "tarefas.json"), "{ nao e json");
    await expect(lerTarefas()).rejects.toBeInstanceOf(ErroWorkflow);
  });
});

describe("agentes", () => {
  it("lista agents/*.md válidos e cruza com as tarefas", async () => {
    await fs.mkdir(path.join(pasta, "agents"));
    await fs.writeFile(
      path.join(pasta, "agents", "perfil-de-cliente-ideal.md"),
      "---\nnome: perfil-de-cliente-ideal\npapel: Cliente ideal\ndescricao: x\nle:\n  - founder/objetivo\n---\n\ncorpo\n",
    );
    await fs.writeFile(path.join(pasta, "agents", "quebrado.md"), "---\nnome: outro\n---\n");
    const agentes = await listarAgentes();
    expect(agentes.map((a) => a.nome)).toEqual(["perfil-de-cliente-ideal"]);

    const t1 = await salvarTarefa({ agente: "perfil-de-cliente-ideal", titulo: "Em curso", status: "trabalhando" });
    await salvarTarefa({ agente: "perfil-de-cliente-ideal", titulo: "Depois" });
    const [icp] = situacaoDosAgentes(agentes, await lerTarefas());
    expect(icp.emAndamento.map((t) => t.id)).toEqual([t1.id]);
    expect(icp.naFila).toBe(1);
  });
});

describe("API /api/workflow", () => {
  it("POST cria, GET devolve", async () => {
    const r = await post({ agente: "perfil-de-cliente-ideal", titulo: "Tarefa", status: "trabalhando", docs: ["direcao/oferta"] });
    expect(r.status).toBe(200);
    const g = await GET(new Request("http://127.0.0.1:3000/api/workflow"));
    const corpo = await g.json();
    expect(corpo.tarefas).toHaveLength(1);
    expect(corpo.tarefas[0].status).toBe("trabalhando");
  });

  it("rejeita doc inexistente, chave desconhecida, JSON ruim e content-type errado", async () => {
    expect((await post({ agente: "perfil-de-cliente-ideal", titulo: "x", docs: ["direcao/nada"] })).status).toBe(400);
    expect((await post({ agente: "perfil-de-cliente-ideal", titulo: "x", extra: 1 })).status).toBe(400);
    expect((await post("{ruim")).status).toBe(400);
    expect((await post({ agente: "perfil-de-cliente-ideal", titulo: "x" }, "text/plain")).status).toBe(415);
  });

  it("exige token quando configurado", async () => {
    vi.stubEnv("BUSINESSOS_API_TOKEN", "segredo");
    expect((await post({ agente: "perfil-de-cliente-ideal", titulo: "x" })).status).toBe(401);
  });
});
