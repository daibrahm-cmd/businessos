// src/app/api/workflow/route.ts
// GET  /api/workflow — tarefas do quadro + agentes (para o agente ver o que já está em andamento).
// POST /api/workflow — o agente cria ou atualiza a própria tarefa (mover de coluna, trocar nota).
// Mesmo controle de acesso e formato de erro de /api/context.
import { verificarAcesso } from "@/lib/content/api/acesso";
import { respostaErro, respostaJson } from "@/lib/content/api/respostas";
import { detalhesDoZod } from "@/lib/content/errors";
import { listarAgentes } from "@/lib/workflow/agentes";
import { ErroWorkflow, lerTarefas, salvarTarefa } from "@/lib/workflow/repositorio";
import { entradaTarefaSchema } from "@/lib/workflow/tipos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Mesmo limite do PUT de contexto: 256 KiB. */
const LIMITE_CORPO_BYTES = 262_144;

function erroDoWorkflow(erro: unknown): Response {
  if (erro instanceof ErroWorkflow) {
    if (erro.codigo === "ARQUIVO_INVALIDO") return respostaErro("CONTEUDO_INVALIDO", erro.message);
    return respostaErro(erro.codigo, erro.message);
  }
  console.error("[api/workflow]", erro);
  return respostaErro("ERRO_INTERNO", "Erro interno. Tente de novo.");
}

export async function GET(req: Request): Promise<Response> {
  const negado = verificarAcesso(req);
  if (negado) return negado;
  try {
    const [tarefas, agentes] = await Promise.all([lerTarefas(), listarAgentes()]);
    return respostaJson({ tarefas, agentes });
  } catch (erro) {
    return erroDoWorkflow(erro);
  }
}

export async function POST(req: Request): Promise<Response> {
  const negado = verificarAcesso(req);
  if (negado) return negado;

  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return respostaErro("TIPO_NAO_SUPORTADO", "Envie Content-Type: application/json.");
  }
  const texto = await req.text();
  if (Buffer.byteLength(texto, "utf8") > LIMITE_CORPO_BYTES) {
    return respostaErro("PAYLOAD_GRANDE", "Corpo maior que 256 KiB.");
  }
  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return respostaErro("JSON_INVALIDO", "O corpo não é um JSON válido.");
  }
  const r = entradaTarefaSchema.safeParse(corpo);
  if (!r.success) {
    return respostaErro("PAYLOAD_INVALIDO", "Corpo inválido.", { detalhes: detalhesDoZod(r.error.issues) });
  }

  try {
    const tarefa = await salvarTarefa(r.data);
    return respostaJson({ tarefa });
  } catch (erro) {
    return erroDoWorkflow(erro);
  }
}
