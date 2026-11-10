// Testes do repositório de oportunidades, usando um diretório temporário.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ErroOportunidades,
  lerOportunidades,
  removerOportunidade,
  salvarOportunidade,
} from "@/lib/oportunidades/repositorio";

let pasta: string;

beforeEach(async () => {
  pasta = await fs.mkdtemp(path.join(os.tmpdir(), "oportunidades-"));
  process.env.BUSINESSOS_STORAGE = "fs"; // estes testes cobrem o backend de arquivo
  process.env.BUSINESSOS_OPORTUNIDADES_FILE = path.join(pasta, "oportunidades.json");
});

afterEach(async () => {
  delete process.env.BUSINESSOS_OPORTUNIDADES_FILE;
  delete process.env.BUSINESSOS_STORAGE;
  await fs.rm(pasta, { recursive: true, force: true });
});

describe("oportunidades", () => {
  it("arquivo ausente = funil vazio", async () => {
    expect(await lerOportunidades()).toEqual([]);
  });

  it("cria no estágio novo, move de coluna e limpa campos opcionais", async () => {
    const o = await salvarOportunidade({ lead: "Ana", titulo: "Mentoria", valor: 1500, empresa: "Acme" });
    expect(o.estagio).toBe("novo");
    expect(o.valor).toBe(1500);

    const movida = await salvarOportunidade({ id: o.id, estagio: "qualificado", valor: null, empresa: "" });
    expect(movida.estagio).toBe("qualificado");
    expect(movida.valor).toBeUndefined();
    expect(movida.empresa).toBeUndefined();
    expect(movida.lead).toBe("Ana");
    expect(await lerOportunidades()).toHaveLength(1);
  });

  it("guarda o vínculo com o lead e o mantém ao mover de coluna", async () => {
    const o = await salvarOportunidade({ lead: "Ana", titulo: "Mentoria", lead_id: "abc123", estagio: "contatado" });
    expect(o.lead_id).toBe("abc123");
    const movida = await salvarOportunidade({ id: o.id, estagio: "em-negociacao" });
    expect(movida.lead_id).toBe("abc123");
    expect(movida.estagio).toBe("em-negociacao");
  });

  it("criar sem lead/título ou atualizar id inexistente falha", async () => {
    await expect(salvarOportunidade({ lead: "Ana" })).rejects.toMatchObject({ codigo: "PAYLOAD_INVALIDO" });
    await expect(salvarOportunidade({ id: "nao-existe", estagio: "ganho" })).rejects.toMatchObject({
      codigo: "NAO_ENCONTRADO",
    });
  });

  it("remove e falha ao remover id inexistente", async () => {
    const o = await salvarOportunidade({ lead: "Bia", titulo: "Consultoria" });
    await removerOportunidade(o.id);
    expect(await lerOportunidades()).toEqual([]);
    await expect(removerOportunidade(o.id)).rejects.toBeInstanceOf(ErroOportunidades);
  });

  it("gravações simultâneas não se perdem", async () => {
    await Promise.all(["a", "b", "c", "d"].map((n) => salvarOportunidade({ lead: n, titulo: `T ${n}` })));
    expect(await lerOportunidades()).toHaveLength(4);
  });

  it("arquivo corrompido lança ARQUIVO_INVALIDO", async () => {
    await fs.writeFile(process.env.BUSINESSOS_OPORTUNIDADES_FILE!, "{ nao e json");
    await expect(lerOportunidades()).rejects.toMatchObject({ codigo: "ARQUIVO_INVALIDO" });
  });
});
