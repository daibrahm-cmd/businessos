// Testes do serviço com um cliente Supabase falso em memória (sem rede).
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ criarClienteServidor: vi.fn() }));
let usuario = "11111111-1111-4111-8111-111111111111";
vi.mock("@/lib/supabase/usuario", () => ({
  usuarioAtualId: async () => usuario,
  ErroNaoAutenticado: class extends Error {},
}));

import {
  _definirFabricaClienteParaTeste,
  enviarArquivo,
  listarArquivos,
  removerArquivo,
  urlAssinada,
} from "@/lib/arquivos/servico";

const U1 = "11111111-1111-4111-8111-111111111111";
const U2 = "22222222-2222-4222-8222-222222222222";

interface Estado {
  objetos: Set<string>;
  linhas: Record<string, unknown>[];
  falharUpload: boolean;
  falharInsert: boolean;
  falharRemoveObjeto: boolean;
}
let est: Estado;
let seq: number;

/** Cliente falso: aplica "RLS" filtrando por user_id do usuário corrente. */
function criarFalso() {
  const meu = () => est.linhas.filter((l) => l.user_id === usuario);
  const consulta = (base: () => Record<string, unknown>[]) => {
    const filtros: Array<(l: Record<string, unknown>) => boolean> = [];
    const q = {
      eq(c: string, v: unknown) {
        filtros.push((l) => l[c] === v);
        return q;
      },
      order: () => q,
      maybeSingle: async () => ({ data: base().find((l) => filtros.every((f) => f(l))) ?? null, error: null }),
      then: (res: (v: unknown) => unknown) =>
        res({ data: base().filter((l) => filtros.every((f) => f(l))), error: null }),
    };
    return q;
  };
  return {
    storage: {
      from: () => ({
        upload: async (caminho: string) => {
          if (est.falharUpload) return { data: null, error: { message: "segredo interno" } };
          est.objetos.add(caminho);
          return { data: { path: caminho }, error: null };
        },
        remove: async (lista: string[]) => {
          if (est.falharRemoveObjeto) return { data: null, error: { message: "x" } };
          lista.forEach((c) => est.objetos.delete(c));
          return { data: [], error: null };
        },
        createSignedUrl: async (caminho: string, s: number) => ({
          data: { signedUrl: `https://x/assinada/${caminho}?t=${s}` },
          error: null,
        }),
      }),
    },
    from: () => ({
      insert: (linha: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            if (est.falharInsert) return { data: null, error: { message: "db interno" } };
            const nova = { id: `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`, criado_em: "2026-01-01T00:00:00Z", ...linha };
            est.linhas.push(nova);
            return { data: nova, error: null };
          },
        }),
      }),
      select: () => consulta(meu),
      delete: () => ({
        eq: async (_c: string, id: string) => {
          est.linhas = est.linhas.filter((l) => !(l.id === id && l.user_id === usuario));
          return { error: null };
        },
      }),
    }),
  };
}

const arq = (nome = "Relatório.pdf", tipo = "application/pdf") =>
  new File([new Uint8Array([1, 2, 3])], nome, { type: tipo });

beforeEach(() => {
  usuario = U1;
  seq = 0;
  est = { objetos: new Set(), linhas: [], falharUpload: false, falharInsert: false, falharRemoveObjeto: false };
  _definirFabricaClienteParaTeste(async () => criarFalso() as never);
});

describe("serviço de arquivos", () => {
  it("envia: objeto no caminho do dono e metadado inserido", async () => {
    const r = await enviarArquivo(arq(), { docId: "founder/objetivo" });
    expect(r.caminho.startsWith(`${U1}/`)).toBe(true);
    expect(r.caminho.endsWith("-Relatorio.pdf")).toBe(true);
    expect(r.nomeOriginal).toBe("Relatório.pdf");
    expect(r.docId).toBe("founder/objetivo");
    expect(est.objetos.has(r.caminho)).toBe(true);
  });

  it("rejeita arquivo inválido antes de tocar no Storage", async () => {
    await expect(enviarArquivo(arq("a.exe", "application/pdf"))).rejects.toMatchObject({ codigo: "EXTENSAO_INVALIDA" });
    expect(est.objetos.size).toBe(0);
  });

  it("rollback: se o insert falha, o objeto é removido e o erro não vaza detalhes", async () => {
    est.falharInsert = true;
    const erro = await enviarArquivo(arq()).catch((e) => e);
    expect(erro.codigo).toBe("FALHA_ENVIO");
    expect(erro.message).not.toMatch(/db interno/);
    expect(est.objetos.size).toBe(0);
  });

  it("falha no upload não grava linha e não vaza detalhes", async () => {
    est.falharUpload = true;
    const erro = await enviarArquivo(arq()).catch((e) => e);
    expect(erro.message).not.toMatch(/segredo/);
    expect(est.linhas).toHaveLength(0);
  });

  it("lista só os do usuário e filtra por docId", async () => {
    await enviarArquivo(arq("a.pdf"), { docId: "d1" });
    await enviarArquivo(arq("b.pdf"));
    usuario = U2;
    await enviarArquivo(arq("c.pdf"), { docId: "d1" });
    expect(await listarArquivos()).toHaveLength(1);
    usuario = U1;
    expect(await listarArquivos()).toHaveLength(2);
    expect((await listarArquivos({ docId: "d1" })).map((a) => a.nomeOriginal)).toEqual(["a.pdf"]);
  });

  it("isolamento: outro usuário não gera URL nem remove", async () => {
    const a = await enviarArquivo(arq());
    usuario = U2;
    await expect(urlAssinada(a.id)).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    await expect(removerArquivo(a.id)).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
    expect(est.objetos.has(a.caminho)).toBe(true);
  });

  it("URL assinada usa 300 s por padrão e aceita valor customizado", async () => {
    const a = await enviarArquivo(arq());
    expect(await urlAssinada(a.id)).toContain("?t=300");
    expect(await urlAssinada(a.id, 60)).toContain("?t=60");
    await expect(urlAssinada("nao-e-uuid")).rejects.toMatchObject({ codigo: "NAO_ENCONTRADO" });
  });

  it("remove objeto e linha; se o objeto falhar, a linha permanece", async () => {
    const a = await enviarArquivo(arq());
    est.falharRemoveObjeto = true;
    await expect(removerArquivo(a.id)).rejects.toMatchObject({ codigo: "FALHA_REMOCAO" });
    expect(est.linhas).toHaveLength(1);
    est.falharRemoveObjeto = false;
    await removerArquivo(a.id);
    expect(est.linhas).toHaveLength(0);
    expect(est.objetos.size).toBe(0);
  });
});
