// scripts/validar-conteudo.ts
// Valida content/ (12 páginas), agents/*.md, skills/*/SKILL.md e a estrutura do AGENTS.md.
// Sai com código 1 se houver erro. Uso: npm run content:validate
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ErroConteudo, detalhesDoZod, type DetalheErro } from "@/lib/content/errors";
import { DOC_IDS } from "@/lib/content/navigation";
import { resolverRaizConteudo } from "@/lib/content/fs-repository";
import { criarSchemaItemCompleto } from "@/lib/content/schemas/build";
import { obterColecao, obterDefinicao } from "@/lib/content/schemas";
import { desserializar } from "@/lib/content/serializacao";
import { validarArquivoAgente, validarArquivoSkill } from "@/lib/content/agentes";

export interface Problema {
  /** Arquivo relativo à raiz do projeto, ex.: "content/direcao/oferta.md". */
  arquivo: string;
  caminho: string;
  mensagem: string;
}

export interface ResultadoValidacao {
  erros: Problema[];
  avisos: Problema[];
  /** Quantidade de arquivos verificados. */
  verificados: number;
}

/** Títulos obrigatórios do AGENTS.md (§10.1). */
const SECOES_AGENTS_MD = [
  "## O que é",
  "## Mapa de documentos",
  "## Como ler",
  "## Como escrever",
  "## Regras",
  "## Agentes e skills",
];

async function lerSeExistir(arquivo: string): Promise<string | undefined> {
  try {
    return await fs.readFile(arquivo, "utf8");
  } catch (erro) {
    if (typeof erro === "object" && erro !== null && "code" in erro && erro.code === "ENOENT") return undefined;
    throw erro;
  }
}

async function listarDiretorio(dir: string): Promise<import("node:fs").Dirent[]> {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/** Lista recursivamente os .md de uma pasta (caminhos relativos a ela, com "/"). */
async function listarMarkdown(dir: string, prefixo = ""): Promise<string[]> {
  const saida: string[] = [];
  for (const entrada of await listarDiretorio(dir)) {
    const relativo = prefixo ? `${prefixo}/${entrada.name}` : entrada.name;
    if (entrada.isDirectory()) saida.push(...(await listarMarkdown(path.join(dir, entrada.name), relativo)));
    else if (entrada.isFile() && entrada.name.endsWith(".md")) saida.push(relativo);
  }
  return saida;
}

function relativo(raizProjeto: string, arquivo: string): string {
  return path.relative(raizProjeto, arquivo).split(path.sep).join("/");
}

/** Valida tudo e devolve erros/avisos (sem imprimir). */
export async function validarProjeto(opcoes: {
  raizProjeto: string;
  raizConteudo?: string;
}): Promise<ResultadoValidacao> {
  const { raizProjeto } = opcoes;
  const raizConteudo = resolverRaizConteudo(opcoes.raizConteudo ?? path.join(raizProjeto, "content"));
  const erros: Problema[] = [];
  const avisos: Problema[] = [];
  let verificados = 0;
  const registrar = (lista: Problema[], arquivo: string, detalhes: DetalheErro[]) =>
    lista.push(...detalhes.map((d) => ({ arquivo, ...d })));

  // 1. Páginas de conteúdo.
  for (const id of DOC_IDS) {
    const arquivo = path.join(raizConteudo, `${id}.md`);
    const nome = relativo(raizProjeto, arquivo);
    const texto = await lerSeExistir(arquivo);
    if (texto === undefined) {
      avisos.push({ arquivo: nome, caminho: "", mensagem: "Arquivo ausente (rode npm run content:seed)." });
      continue;
    }
    verificados += 1;
    const def = obterDefinicao(id);
    try {
      const doc = desserializar(texto, def);
      // Itens também precisam respeitar `obrigatorio` (senão a próxima gravação da página falha).
      doc.itens.forEach((item, i) => {
        const col = obterColecao(def, item.colecao);
        if (!col) return;
        const r = criarSchemaItemCompleto(col).safeParse(item);
        if (!r.success) {
          registrar(
            erros,
            nome,
            detalhesDoZod(r.error.issues.map((issue) => ({ ...issue, path: ["itens", i, ...issue.path] }))),
          );
        }
      });
    } catch (erro) {
      if (erro instanceof ErroConteudo) registrar(erros, nome, erro.detalhes ?? [{ caminho: "", mensagem: erro.message }]);
      else throw erro;
    }
  }

  // Arquivos .md em content/ que não pertencem à navegação são ignorados pelo app.
  const esperados = new Set(DOC_IDS.map((id) => `${id}.md`));
  for (const extra of await listarMarkdown(raizConteudo)) {
    if (!esperados.has(extra)) {
      avisos.push({
        arquivo: relativo(raizProjeto, path.join(raizConteudo, extra)),
        caminho: "",
        mensagem: "Arquivo fora da navegação (ignorado pelo app).",
      });
    }
  }

  // 2. Skills.
  const dirSkills = path.join(raizProjeto, "skills");
  const skills = new Set<string>();
  for (const entrada of await listarDiretorio(dirSkills)) {
    if (!entrada.isDirectory()) continue;
    const arquivo = path.join(dirSkills, entrada.name, "SKILL.md");
    const texto = await lerSeExistir(arquivo);
    if (texto === undefined) {
      erros.push({ arquivo: relativo(raizProjeto, arquivo), caminho: "", mensagem: "SKILL.md ausente." });
      continue;
    }
    verificados += 1;
    skills.add(entrada.name);
    registrar(erros, relativo(raizProjeto, arquivo), validarArquivoSkill(texto, entrada.name));
  }

  // 3. Agentes.
  const dirAgentes = path.join(raizProjeto, "agents");
  for (const entrada of await listarDiretorio(dirAgentes)) {
    if (!entrada.isFile() || !entrada.name.endsWith(".md")) continue;
    const arquivo = path.join(dirAgentes, entrada.name);
    verificados += 1;
    const texto = await fs.readFile(arquivo, "utf8");
    registrar(erros, relativo(raizProjeto, arquivo), validarArquivoAgente(texto, entrada.name.slice(0, -3), skills));
  }

  // 4. AGENTS.md: seções obrigatórias e mapa com os 12 ids.
  const agentsMd = await lerSeExistir(path.join(raizProjeto, "AGENTS.md"));
  if (agentsMd === undefined) {
    erros.push({ arquivo: "AGENTS.md", caminho: "", mensagem: "Arquivo ausente." });
  } else {
    verificados += 1;
    const linhas = new Set(agentsMd.split(/\r?\n/).map((l) => l.trim()));
    for (const secao of SECOES_AGENTS_MD) {
      if (![...linhas].some((l) => l === secao || l.startsWith(`${secao} `))) {
        erros.push({ arquivo: "AGENTS.md", caminho: "", mensagem: `Seção obrigatória ausente: "${secao}".` });
      }
    }
    for (const id of DOC_IDS) {
      if (!agentsMd.includes(id)) {
        erros.push({ arquivo: "AGENTS.md", caminho: "", mensagem: `Mapa de documentos sem o id ${id}.` });
      }
    }
  }

  return { erros, avisos, verificados };
}

function formatar(p: Problema): string {
  return `  ${p.arquivo}${p.caminho ? ` → ${p.caminho}` : ""}: ${p.mensagem}\n`;
}

async function main(): Promise<void> {
  const raizProjeto = process.cwd();
  const resultado = await validarProjeto({
    raizProjeto,
    raizConteudo: process.env.BUSINESSOS_CONTENT_DIR || undefined,
  });
  if (resultado.avisos.length > 0) {
    process.stdout.write(`Avisos (${resultado.avisos.length}):\n${resultado.avisos.map(formatar).join("")}\n`);
  }
  if (resultado.erros.length > 0) {
    process.stderr.write(`Erros (${resultado.erros.length}):\n${resultado.erros.map(formatar).join("")}`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`Conteúdo válido: ${resultado.verificados} arquivo(s) verificado(s).\n`);
}

// Executa só quando chamado direto (tsx scripts/validar-conteudo.ts), não ao ser importado nos testes.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((erro: unknown) => {
    console.error("Falha ao validar o conteúdo:", erro);
    process.exit(1);
  });
}
