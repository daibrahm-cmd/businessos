// src/app/api/context/[secao]/[pagina]/route.ts
// GET e PUT de um documento de contexto (§6.3). PUT = atualização parcial com merge (§5.4).
// Dinâmico: o conteúdo muda por fora (agentes), então nada é pré-renderizado nem cacheado.
import { verificarAcesso } from "@/lib/content/api/acesso";
import { LIMITE_CORPO_BYTES, validarCorpoPut } from "@/lib/content/api/corpo-put";
import {
  lerFormato,
  respostaDeErro,
  respostaErro,
  respostaFormatoInvalido,
  respostaJson,
  respostaMarkdown,
} from "@/lib/content/api/respostas";
import { comContextoApi } from "@/lib/content/repository";
import { montarId } from "@/lib/content/navigation";
import { obterDefinicao } from "@/lib/content/schemas";
import { serializar } from "@/lib/content/serializacao";
import { atualizarDocumento, lerDocumento } from "@/lib/content/servico";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Contexto = { params: Promise<{ secao: string; pagina: string }> };

function naoEncontrado(): Response {
  return respostaErro("NAO_ENCONTRADO", "Documento não encontrado.");
}

async function tratarGET(req: Request, { params }: Contexto): Promise<Response> {
  const negado = verificarAcesso(req);
  if (negado) return negado;

  try {
    // Valida o id contra a navegação antes de qualquer acesso a disco (bloqueia traversal).
    const { secao, pagina } = await params;
    const id = montarId(secao, pagina);
    if (!id) return naoEncontrado();

    const formato = lerFormato(new URL(req.url));
    if (!formato) return respostaFormatoInvalido();

    const def = obterDefinicao(id);
    const documento = await lerDocumento(id);
    if (formato === "md") return respostaMarkdown(serializar(documento, def));
    return respostaJson({ documento, definicao: def });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}

async function tratarPUT(req: Request, { params }: Contexto): Promise<Response> {
  // 1. Guarda de acesso.
  const negado = verificarAcesso(req);
  if (negado) return negado;

  try {
    // 2. Id válido.
    const { secao, pagina } = await params;
    const id = montarId(secao, pagina);
    if (!id) return naoEncontrado();

    // 3. Content-Type JSON (impede "simple requests" CSRF vindos de formulários).
    const tipo = req.headers.get("content-type")?.trim().toLowerCase() ?? "";
    if (!tipo.startsWith("application/json")) {
      return respostaErro("TIPO_NAO_SUPORTADO", 'Use "Content-Type: application/json".');
    }

    // 4. Tamanho: cabeçalho declarado e corpo lido.
    const mensagemGrande = `Corpo maior que ${LIMITE_CORPO_BYTES / 1024} KiB.`;
    const declarado = Number(req.headers.get("content-length"));
    if (Number.isFinite(declarado) && declarado > LIMITE_CORPO_BYTES) {
      return respostaErro("PAYLOAD_GRANDE", mensagemGrande);
    }
    const texto = await req.text();
    if (Buffer.byteLength(texto, "utf8") > LIMITE_CORPO_BYTES) {
      return respostaErro("PAYLOAD_GRANDE", mensagemGrande);
    }

    // 5. JSON bem formado com raiz objeto.
    let corpo: unknown;
    try {
      corpo = JSON.parse(texto);
    } catch {
      return respostaErro("JSON_INVALIDO", "JSON malformado.");
    }
    if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo)) {
      return respostaErro("JSON_INVALIDO", "A raiz do JSON deve ser um objeto.");
    }

    // 6. Schema do corpo (lança PAYLOAD_INVALIDO) → 7. serviço (merge, conflito, gravação).
    const { patch, autor, esperadoAtualizadoEm } = validarCorpoPut(obterDefinicao(id), corpo);
    const documento = await atualizarDocumento({ id, patch, autor, esperadoAtualizadoEm });
    return respostaJson({ documento });
  } catch (erro) {
    return respostaDeErro(erro);
  }
}

// Agentes (Bearer) rodam com o contexto "api": chave de serviço + BUSINESSOS_API_USER_ID.
export const GET = (req: Request, ctx: Contexto): Promise<Response> => comContextoApi(() => tratarGET(req, ctx));
export const PUT = (req: Request, ctx: Contexto): Promise<Response> => comContextoApi(() => tratarPUT(req, ctx));
