// Testes do repositório em banco com um cliente Supabase falso (em memória). Nada toca rede.
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErroConteudo } from "@/lib/content/errors";
import { DOC_IDS } from "@/lib/content/navigation";
import { obterDefinicao } from "@/lib/content/schemas";
import { criarTemplate } from "@/lib/content/schemas/build";
import {
  SupabaseContentRepository,
  type ClienteDocumentos,
  type LinhaDocumento,
} from "@/lib/content/supabase-repository";

type Erro = { code?: string; message?: string };

/** Banco falso: chave "user_id|id". `falha` força erro em todas as operações. */
function criarFake(falha?: Erro) {
  const linhas = new Map<string, LinhaDocumento>();
  const consultas: string[] = [];
  const resp = <T>(data: T) => Promise.resolve({ data: falha ? null : data, error: falha ?? null });
  const cliente = {
    from(tabela: string) {
      expect(tabela).toBe("documentos");
      return {
        select: () => ({
          eq: (_c: string, userId: string) => {
            consultas.push("list");
            const lista = resp([...linhas.values()].filter((l) => l.user_id === userId));
            return Object.assign(lista, {
              eq: (_c2: string, id: string) => ({
                maybeSingle: () => {
                  consultas.push("get");
                  return resp(linhas.get(`${userId}|${id}`) ?? null);
                },
              }),
            });
          },
        }),
        upsert: (linha: LinhaDocumento) => ({
          select: () => ({
            single: () => {
              if (!falha) linhas.set(`${linha.user_id}|${linha.id}`, linha);
              return resp(linha);
            },
          }),
        }),
      };
    },
  } as unknown as ClienteDocumentos;
  return { cliente, linhas, consultas };
}

const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";

function docObjetivo() {
  const doc = criarTemplate(obterDefinicao("founder/objetivo"));
  const primeiro = obterDefinicao("founder/objetivo").campos[0];
  return { doc, campo: primeiro.nome };
}

async function erroDe(p: Promise<unknown>): Promise<ErroConteudo> {
  try {
    await p;
  } catch (e) {
    if (e instanceof ErroConteudo) return e;
    throw e;
  }
  throw new Error("Era esperado um erro.");
}

afterEach(() => vi.restoreAllMocks());

describe("SupabaseContentRepository", () => {
  it("list: 1 consulta, 13 templates na ordem da navegação quando o banco está vazio", async () => {
    const { cliente, consultas } = criarFake();
    const docs = await new SupabaseContentRepository(cliente, USER_A).list();
    expect(docs.map((d) => d.id)).toEqual([...DOC_IDS]);
    expect(docs.every((d) => d.status === "vazio")).toBe(true);
    expect(consultas).toEqual(["list"]);
  });

  it("get: id fora da navegação → NAO_ENCONTRADO sem consultar o banco", async () => {
    const { cliente, consultas } = criarFake();
    const repo = new SupabaseContentRepository(cliente, USER_A);
    const erro = await erroDe(repo.get("../etc/passwd" as never));
    expect(erro.codigo).toBe("NAO_ENCONTRADO");
    expect(consultas).toEqual([]);
  });

  it("get: ausente devolve template (título vem do schema)", async () => {
    const { cliente } = criarFake();
    const doc = await new SupabaseContentRepository(cliente, USER_A).get("founder/objetivo");
    expect(doc).toEqual(criarTemplate(obterDefinicao("founder/objetivo")));
  });

  it("save + get + list: grava e lê de volta o documento normalizado", async () => {
    const { cliente, linhas } = criarFake();
    const repo = new SupabaseContentRepository(cliente, USER_A);
    const { doc, campo } = docObjetivo();
    const salvo = await repo.save({
      ...doc,
      status: "rascunho",
      atualizado_em: "2026-01-02T03:04:05.000Z",
      campos: { ...doc.campos, [campo]: "Texto de teste" },
      corpo: "Notas\n",
    });
    expect(salvo.campos[campo]).toBe("Texto de teste");
    expect(linhas.get(`${USER_A}|founder/objetivo`)?.user_id).toBe(USER_A);
    // Título/descrição/estágio não são colunas.
    expect(linhas.get(`${USER_A}|founder/objetivo`)).not.toHaveProperty("titulo");

    const lido = await repo.get("founder/objetivo");
    expect(lido).toEqual(salvo);
    const todos = await repo.list();
    expect(todos).toHaveLength(DOC_IDS.length);
    expect(todos[0]).toEqual(salvo);
  });

  it("save: upsert substitui a linha existente (mesmo user_id+id)", async () => {
    const { cliente, linhas } = criarFake();
    const repo = new SupabaseContentRepository(cliente, USER_A);
    const { doc } = docObjetivo();
    await repo.save({ ...doc, corpo: "um\n" });
    await repo.save({ ...doc, corpo: "dois\n" });
    expect(linhas.size).toBe(1);
    expect((await repo.get("founder/objetivo")).corpo).toBe("dois\n");
  });

  it("save: valida pelo schema ANTES de gravar", async () => {
    const { cliente, linhas } = criarFake();
    const repo = new SupabaseContentRepository(cliente, USER_A);
    const { doc } = docObjetivo();
    const invalido = { ...doc, status: "inexistente" } as never;
    const erro = await erroDe(repo.save(invalido));
    expect(erro.codigo).toBe("PAYLOAD_INVALIDO");
    expect(linhas.size).toBe(0);
  });

  it("isolamento: cada userId enxerga só as próprias linhas", async () => {
    const { cliente } = criarFake();
    const a = new SupabaseContentRepository(cliente, USER_A);
    const b = new SupabaseContentRepository(cliente, USER_B);
    const { doc } = docObjetivo();
    await a.save({ ...doc, corpo: "segredo de A\n" });
    expect((await b.get("founder/objetivo")).corpo).toBe("");
    expect((await b.list())[0].status).toBe("vazio");
    expect((await a.get("founder/objetivo")).corpo).toBe("segredo de A\n");
  });

  it("linha corrompida no banco → CONTEUDO_INVALIDO", async () => {
    const { cliente, linhas } = criarFake();
    linhas.set(`${USER_A}|founder/objetivo`, {
      user_id: USER_A, id: "founder/objetivo", secao: "founder", pagina: "objetivo", status: "lixo",
      atualizado_em: "2026-01-01T00:00:00.000Z", atualizado_por: "humano", tags: [], relacionados: [],
      campos: {}, itens: [], corpo: "", extras: {},
    });
    const erro = await erroDe(new SupabaseContentRepository(cliente, USER_A).get("founder/objetivo"));
    expect(erro.codigo).toBe("CONTEUDO_INVALIDO");
  });

  it("exige userId", () => {
    expect(() => new SupabaseContentRepository(criarFake().cliente, "")).toThrow(ErroConteudo);
  });

  describe("mapeamento de erros (sem vazar detalhes internos)", () => {
    const segredo = 'relation "public.documentos" does not exist: SELECT secreto';
    const casos: Array<[string, Erro, string]> = [
      ["RLS/permissão", { code: "42501", message: segredo }, "PROIBIDO"],
      ["JWT inválido", { code: "PGRST301", message: segredo }, "PROIBIDO"],
      ["deadlock", { code: "40P01", message: segredo }, "CONFLITO"],
      ["tabela ausente", { code: "42P01", message: segredo }, "ERRO_INTERNO"],
      ["desconhecido", { message: segredo }, "ERRO_INTERNO"],
    ];
    for (const [nome, falha, codigo] of casos) {
      it(`${nome} → ${codigo}`, async () => {
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        const repo = new SupabaseContentRepository(criarFake(falha).cliente, USER_A);
        const { doc } = docObjetivo();
        for (const op of [() => repo.list(), () => repo.get("founder/objetivo"), () => repo.save(doc)]) {
          const erro = await erroDe(op());
          expect(erro.codigo).toBe(codigo);
          expect(erro.message).not.toContain("documentos");
          expect(erro.message).not.toContain("secreto");
        }
      });
    }
  });
});
