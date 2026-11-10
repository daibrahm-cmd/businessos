// IA por página (botões "Pedir à IA" e "Gerar relatório" do modal Editar).
// Roda só no servidor. Nada é salvo aqui: o resultado volta para o rascunho do editor, que a pessoa revisa e salva.
import { obterProvedorIA } from "@/lib/ia/provedor"
import { exportarMarkdown } from "@/lib/content/exportar-md"
import { obterDefinicao } from "@/lib/content/schemas"
import { schemaEscritaDoCampo, valorVazio } from "@/lib/content/schemas/build"
import type { FieldDef, PageDefinition } from "@/lib/content/schemas/field-types"
import type { DocId } from "@/lib/content/navigation"
import { listarDocumentos } from "@/lib/content/servico"
import type { ValorCampo } from "@/lib/content/types"

/** Descrição de um campo para o prompt: nome, tipo e o que é aceito. */
function descreverCampo(c: FieldDef): string {
  const base = `- ${c.nome} (${c.rotulo}; tipo ${c.tipo}`
  switch (c.tipo) {
    case "selecao":
      return `${base}; valores permitidos: ${c.opcoes.map((o) => `"${o.valor}" = ${o.rotulo}`).join(", ")})`
    case "numero":
    case "moeda":
      return `${base}; número${c.min !== undefined ? `, mínimo ${c.min}` : ""}${c.max !== undefined ? `, máximo ${c.max}` : ""})`
    case "lista-texto":
      return `${base}; lista de textos curtos)`
    case "data":
      return `${base}; formato AAAA-MM-DD)`
    default:
      return `${base})${c.ajuda ? ` — ${c.ajuda}` : ""}`
  }
}

/** Primeiro objeto JSON do texto (o modelo pode cercar com ``` ou escrever uma frase antes). */
export function extrairJson(texto: string): unknown {
  const ini = texto.indexOf("{")
  const fim = texto.lastIndexOf("}")
  if (ini < 0 || fim <= ini) throw new Error("A IA não devolveu um JSON válido. Tente de novo.")
  try {
    return JSON.parse(texto.slice(ini, fim + 1))
  } catch {
    throw new Error("A IA não devolveu um JSON válido. Tente de novo.")
  }
}

/** Mantém só campos que existem na página, vazios hoje e com valor aceito pelo schema; o resto é descartado. */
export function validarSugestoes(
  def: PageDefinition,
  bruto: unknown,
  atuais: Record<string, ValorCampo>,
): Record<string, ValorCampo> {
  const origem =
    typeof bruto === "object" && bruto !== null && "campos" in bruto && typeof bruto.campos === "object" && bruto.campos
      ? (bruto.campos as Record<string, unknown>)
      : {}
  const saida: Record<string, ValorCampo> = {}
  for (const campo of def.campos) {
    if (!(campo.nome in origem) || !valorVazio(atuais[campo.nome])) continue
    const r = schemaEscritaDoCampo(campo).safeParse(origem[campo.nome])
    if (r.success && !valorVazio(r.data)) saida[campo.nome] = r.data
  }
  return saida
}

async function contextoDaPagina(id: DocId) {
  const docs = await listarDocumentos()
  const doc = docs.find((d) => d.id === id)
  if (!doc) throw new Error("Página não encontrada.")
  return { docs, doc, def: obterDefinicao(id) }
}

const REGRAS = `Regras:
- Use SOMENTE o que está no contexto. Não invente fatos, números ou nomes.
- Português do Brasil, direto, sem elogios genéricos.`

/** "Pedir à IA": sugere valores para os campos VAZIOS da página, com base nas outras páginas. */
export async function sugerirCampos(id: DocId): Promise<Record<string, ValorCampo>> {
  const { docs, doc, def } = await contextoDaPagina(id)
  const vazios = def.campos.filter((c) => valorVazio(doc.campos[c.nome]))
  if (vazios.length === 0) return {}

  const instrucoes = `Você ajuda uma fundadora a preencher a página "${def.titulo}" do BusinessOS.
O contexto abaixo traz todas as páginas já preenchidas. Sugira valores para os campos vazios desta página:
${vazios.map(descreverCampo).join("\n")}

Responda APENAS com JSON, sem texto extra, neste formato: {"campos": {"<nome_do_campo>": <valor>}}
${REGRAS}
- Só inclua um campo se o contexto der base real para ele; na dúvida, omita o campo.
- Respeite o tipo: seleção só com um dos valores permitidos; número como número; lista como lista de textos.`

  const resposta = await obterProvedorIA().gerar(exportarMarkdown(docs), instrucoes)
  return validarSugestoes(def, extrairJson(resposta), doc.campos)
}

/** "Gerar relatório": texto para o campo de notas da página, no formato que a tela de leitura sabe organizar. */
export async function gerarRelatorio(id: DocId): Promise<string> {
  const { docs, def } = await contextoDaPagina(id)
  const dd = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" })

  const instrucoes = `Você escreve o relatório da página "${def.titulo}" do BusinessOS, a partir do contexto abaixo.
Escreva em Markdown, começando EXATAMENTE por esta linha: ## Sugestão da IA (${dd})
Depois, organize em grupos (uma linha terminando em ":") com itens "- Rótulo: texto".
Destaque com **negrito** até 3 números ou fatos-chave. Termine uma linha com "?" quando algo precisar ser respondido.
${REGRAS}
- Se faltar informação, diga o que falta em vez de preencher.
Responda só com o Markdown do relatório.`

  return obterProvedorIA().gerar(exportarMarkdown(docs), instrucoes)
}
