// Renderizador mínimo e seguro de Markdown (§8.4).
// Sem dependências e sem dangerouslySetInnerHTML: tudo vira elementos React,
// então qualquer HTML digitado aparece como texto literal (zero risco de XSS).
// Suporta: #/##/### (como h3/h4/h5), parágrafos, listas "-"/"*" e "1.",
// **negrito**, *itálico*, `código`, links [texto](http(s)://…) e quebra de linha simples.
// Trade-off: não renderiza tabelas, imagens, citações nem blocos de código.
import * as React from "react"

type Bloco =
  | { tipo: "titulo"; nivel: 1 | 2 | 3; texto: string }
  | { tipo: "paragrafo"; linhas: string[] }
  | { tipo: "lista"; ordenada: boolean; itens: string[] }

const RE_TITULO = /^(#{1,3})\s+(.*)$/
const RE_ITEM_NAO_ORDENADO = /^\s*[-*]\s+(.*)$/
const RE_ITEM_ORDENADO = /^\s*\d+[.)]\s+(.*)$/

/** Quebra o texto em blocos (títulos, parágrafos e listas). */
function separarBlocos(md: string): Bloco[] {
  const blocos: Bloco[] = []
  const linhas = md.replace(/\r\n?/g, "\n").split("\n")
  let atual: Bloco | null = null

  const fechar = () => {
    if (atual) blocos.push(atual)
    atual = null
  }

  for (const linha of linhas) {
    if (linha.trim() === "") {
      fechar()
      continue
    }

    const titulo = RE_TITULO.exec(linha)
    if (titulo) {
      fechar()
      blocos.push({
        tipo: "titulo",
        nivel: titulo[1].length as 1 | 2 | 3,
        texto: titulo[2].trim(),
      })
      continue
    }

    const naoOrdenado = RE_ITEM_NAO_ORDENADO.exec(linha)
    const ordenado = naoOrdenado ? null : RE_ITEM_ORDENADO.exec(linha)
    if (naoOrdenado || ordenado) {
      const ehOrdenada = Boolean(ordenado)
      const texto = (naoOrdenado ?? ordenado)![1]
      const bloco = atual as Bloco | null
      if (bloco?.tipo === "lista" && bloco.ordenada === ehOrdenada) {
        bloco.itens.push(texto)
      } else {
        fechar()
        atual = { tipo: "lista", ordenada: ehOrdenada, itens: [texto] }
      }
      continue
    }

    const bloco = atual as Bloco | null
    if (bloco?.tipo === "paragrafo") {
      bloco.linhas.push(linha.trim())
    } else if (bloco?.tipo === "lista") {
      // Linha solta logo após um item: continua o último item da lista
      bloco.itens[bloco.itens.length - 1] += " " + linha.trim()
    } else {
      fechar()
      atual = { tipo: "paragrafo", linhas: [linha.trim()] }
    }
  }
  fechar()
  return blocos
}

// Ordem importa: código primeiro (conteúdo literal), depois link, negrito e itálico.
const RE_INLINE =
  /`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g

/** Converte a formatação inline em elementos React. */
export function renderizarInline(texto: string, chaveBase: string): React.ReactNode[] {
  const nos: React.ReactNode[] = []
  let ultimo = 0
  let indice = 0

  for (const casamento of texto.matchAll(RE_INLINE)) {
    const inicio = casamento.index ?? 0
    if (inicio > ultimo) nos.push(texto.slice(ultimo, inicio))
    const chave = `${chaveBase}-${indice++}`
    const [, codigo, textoLink, url, negrito, italico] = casamento

    if (codigo !== undefined) {
      nos.push(
        <code key={chave} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {codigo}
        </code>,
      )
    } else if (textoLink !== undefined && url !== undefined) {
      nos.push(
        <a
          key={chave}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline underline-offset-4 hover:text-muted-foreground"
        >
          {renderizarInline(textoLink, chave)}
        </a>,
      )
    } else if (negrito !== undefined) {
      nos.push(
        <strong key={chave} className="font-semibold">
          {renderizarInline(negrito, chave)}
        </strong>,
      )
    } else if (italico !== undefined) {
      nos.push(<em key={chave}>{renderizarInline(italico, chave)}</em>)
    }
    ultimo = inicio + casamento[0].length
  }

  if (ultimo < texto.length) nos.push(texto.slice(ultimo))
  return nos
}

const CLASSES_TITULO = {
  1: "text-lg font-semibold tracking-tight",
  2: "text-base font-semibold",
  3: "text-sm font-semibold",
} as const

/** Renderiza Markdown simples como elementos React (sem HTML cru). */
export function renderMarkdownSimples(md: string): React.ReactNode {
  const blocos = separarBlocos(md)
  if (blocos.length === 0) return null

  return (
    <div className="space-y-3 text-sm leading-relaxed break-words">
      {blocos.map((bloco, i) => {
        const chave = `b${i}`
        if (bloco.tipo === "titulo") {
          // Títulos das notas ficam abaixo do h1/h2 da página: # → h3, ## → h4, ### → h5
          const Tag = (["h3", "h4", "h5"] as const)[bloco.nivel - 1]
          return (
            <Tag key={chave} className={CLASSES_TITULO[bloco.nivel]}>
              {renderizarInline(bloco.texto, chave)}
            </Tag>
          )
        }
        if (bloco.tipo === "lista") {
          const Tag = bloco.ordenada ? "ol" : "ul"
          return (
            <Tag
              key={chave}
              className={bloco.ordenada ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}
            >
              {bloco.itens.map((item, j) => (
                <li key={`${chave}-${j}`}>{renderizarInline(item, `${chave}-${j}`)}</li>
              ))}
            </Tag>
          )
        }
        return (
          <p key={chave}>
            {bloco.linhas.map((linha, j) => (
              <React.Fragment key={`${chave}-${j}`}>
                {j > 0 && <br />}
                {renderizarInline(linha, `${chave}-${j}`)}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
