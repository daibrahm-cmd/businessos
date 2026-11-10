// Briefing do negócio: junta as respostas das 13 páginas e pede ao Claude (CLI local) uma análise.
// Roda só no servidor. Usa o provedor de IA configurado (API da Anthropic ou CLI local), via lib/ia/provedor.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { obterProvedorIA } from "@/lib/ia/provedor"
import { calcularCompletude } from "@/lib/content/completude"
import { exportarMarkdown } from "@/lib/content/exportar-md"
import { obterDefinicao } from "@/lib/content/schemas"
import { listarDocumentos } from "@/lib/content/servico"

const ARQUIVO = path.join(process.cwd(), "briefing", "briefing.md")

/** Instruções fixas: formato do briefing e regras para não inventar nada. */
const INSTRUCOES = `Você é uma consultora sênior de negócios analisando as respostas de uma fundadora que está começando.
Abaixo vem o contexto do negócio em Markdown (13 páginas: Founder, Direção, Validação, Caixa).

Escreva um BRIEFING em português do Brasil, em Markdown, com exatamente estas seções:
## Resumo em 5 linhas
## Quem é a fundadora e o que ela precisa
## Mercado e cliente
## Tese e oferta
## Conta que fecha? (cruze renda desejada, faturamento necessário, preço, custo, clientes necessários e capacidade; mostre as contas)
## Contradições e pontos frágeis
## O que falta responder (liste os campos vazios mais importantes, por página)
## Riscos
## Próximos 3 passos nos próximos 30 dias

Regras:
- Use SOMENTE o que está no contexto. Não invente fatos, números ou nomes. Se algo não foi informado, escreva "não informado".
- Cite de qual página/campo veio a informação importante (ex.: "Objetivo > renda mínima").
- Aponte incoerências entre páginas (ex.: horas disponíveis x horas por cliente x capacidade de clientes).
- Seja direta, sem elogios genéricos. Frases curtas.
- Se o contexto estiver quase vazio, diga isso no início e foque em "O que falta responder".`

export interface BriefingSalvo {
  /** Markdown do briefing (sem o cabeçalho técnico). */
  texto: string
  /** ISO de quando foi gerado. */
  geradoEm: string
  /** Percentual médio de preenchimento no momento da geração. */
  completude: number
}

/** Percentual médio de preenchimento das 13 páginas (0–100). */
export async function completudeGeral(): Promise<number> {
  const docs = await listarDocumentos()
  const parciais = docs.map((d) => calcularCompletude(d, obterDefinicao(d.id)).percentual)
  return parciais.length ? Math.round(parciais.reduce((a, b) => a + b, 0) / parciais.length) : 0
}

/** Gera um briefing novo a partir das respostas atuais e grava em briefing/briefing.md. */
export async function gerarBriefing(): Promise<BriefingSalvo> {
  const docs = await listarDocumentos()
  const completude = await completudeGeral()
  const texto = await obterProvedorIA().gerar(exportarMarkdown(docs), INSTRUCOES)
  const geradoEm = new Date().toISOString()

  await mkdir(path.dirname(ARQUIVO), { recursive: true })
  await writeFile(ARQUIVO, `---\ngerado_em: '${geradoEm}'\ncompletude: ${completude}\n---\n\n${texto}\n`, "utf8")
  return { texto, geradoEm, completude }
}

/** Último briefing gravado, ou null se ainda não existe. */
export async function lerBriefing(): Promise<BriefingSalvo | null> {
  let bruto: string
  try {
    bruto = await readFile(ARQUIVO, "utf8")
  } catch {
    return null
  }
  const m = /^---\ngerado_em: '([^']+)'\ncompletude: (\d+)\n---\n\n([\s\S]*)$/.exec(bruto)
  if (!m) return null
  return { geradoEm: m[1], completude: Number(m[2]), texto: m[3].trim() }
}
