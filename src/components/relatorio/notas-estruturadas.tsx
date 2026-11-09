// Notas com hierarquia visual: cabeçalho colorido por entrada (autor, título, data), texto de abertura em destaque,
// cartões com os números em negrito, tabelas reais, grupos em tabela por tema e selos para hipótese/fato/lacuna.
// Entradas marcadas como [DESCARTADA] ficam recolhidas e esmaecidas (abrem ao clicar).
import type * as React from "react"
import { Badge } from "@/components/ui/badge"
import type { EntradaNota, GrupoNota, ItemNota, TabelaNota } from "@/lib/markdown/notas"
import { renderizarInline } from "@/lib/markdown/render-simples"
import { cn } from "@/lib/utils"

const CARD = "rounded-xl bg-card p-4 ring-1 ring-foreground/10"
const ROTULO = "text-[10.5px] font-semibold tracking-[0.12em] text-[#B0C2C2] uppercase"

// Etiquetas reconhecidas no texto: viram selos (hipótese, fato, lacuna).
const RE_ETIQUETA = /(\[HIP\]|\[FATO\]|não encontrad[oa])/gi
const ESTILO_ETIQUETA = "mx-0.5 inline-block rounded-full px-1.5 py-px align-middle text-[10px] font-bold tracking-wider uppercase"

function comEtiquetas(nos: React.ReactNode[], chave: string): React.ReactNode[] {
  return nos.flatMap((no, n) => {
    if (typeof no !== "string") return [no]
    return no.split(RE_ETIQUETA).map((parte, k) => {
      const c = `${chave}-${n}-${k}`
      const p = parte.toLowerCase()
      if (p === "[hip]") return <span key={c} className={cn(ESTILO_ETIQUETA, "bg-primary/15 text-primary")}>Hip</span>
      if (p === "[fato]") return <span key={c} className={cn(ESTILO_ETIQUETA, "bg-[#B0C2C2]/25 text-[#B0C2C2]")}>Fato</span>
      if (p.startsWith("não encontrad")) return <span key={c} className={cn(ESTILO_ETIQUETA, "bg-red-400/20 text-red-300")}>Não encontrado</span>
      return parte
    })
  })
}

/** Tira do negrito os trechos que viram selo: "**Espaço livre [HIP]:**" vira "**Espaço livre:** [HIP]". */
function prepararSelos(t: string): string {
  return t
    .replace(/\*\*(não encontrad[oa])\*\*/gi, "$1")
    .replace(/\*\*([^*]*?)\s*(\[(?:HIP|FATO)\])([^*]*)\*\*/g, (_, a: string, selo: string, b: string) => {
      const dentro = `${a}${b}`.replace(/\s+([:;,.])/g, "$1").trim()
      return `**${dentro}** ${selo}`
    })
}

/** Texto inline com negrito, links e selos (hipótese, fato, não encontrado). */
const texto = (t: string, chave: string) => comEtiquetas(renderizarInline(prepararSelos(t), chave), `e${chave}`)

/** Item que é só um texto em negrito, sem rótulo: funciona como título de tema. */
const ehTituloDeTema = (item: ItemNota) => !item.rotulo && /^\*\*[^*]+\*\*$/.test(item.texto.trim())

// Grupo em tabela por tema: barra Marinho para o tema, rótulo curto à esquerda e conteúdo à direita.
function ColunaGrupo({ grupo }: { grupo: GrupoNota }) {
  return (
    <section className={cn(CARD, "space-y-1")}>
      <h3 className="mb-2 flex items-start justify-between gap-2 text-[13px] font-bold tracking-wide uppercase">
        <span className="min-w-0 break-words">{grupo.titulo}</span>
        <Badge variant="secondary" className="shrink-0">
          {grupo.itens.length}
        </Badge>
      </h3>
      <ul>
        {grupo.itens.map((item, i) => {
          const chave = `${i}-${item.texto.slice(0, 20)}`
          if (ehTituloDeTema(item)) {
            return (
              <li
                key={chave}
                className="mt-4 mb-1 rounded-md bg-[#3F495A] px-2.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-[#EFEFEF] uppercase first:mt-0"
              >
                {item.texto.replace(/\*\*/g, "")}
              </li>
            )
          }
          return (
            <li
              key={chave}
              className={cn(
                "grid gap-x-3 border-b border-dashed border-foreground/10 py-2.5 last:border-b-0",
                item.rotulo ? "grid-cols-[110px_minmax(0,1fr)]" : "grid-cols-1",
              )}
            >
              {item.rotulo && <p className={cn(ROTULO, "pt-0.5 break-words")}>{item.rotulo}</p>}
              <p className="text-[13px] leading-relaxed break-words [&_strong]:font-bold [&_strong]:text-foreground">
                {texto(item.texto, `i${i}`)}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Tabela Markdown: cabeçalho Marinho, linhas alternadas, primeira coluna em destaque.
function Tabela({ tabela, chave }: { tabela: TabelaNota; chave: string }) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr className="bg-[#3F495A] text-[#EFEFEF]">
            {tabela.cabecalho.map((c, i) => (
              <th key={i} className="px-3 py-2 text-[11px] font-bold tracking-[0.1em] whitespace-nowrap uppercase">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tabela.linhas.map((linha, r) => (
            <tr key={r} className="border-t border-foreground/10 odd:bg-card even:bg-foreground/5">
              {linha.map((c, i) => (
                <td key={i} className={cn("px-3 py-2 align-top tabular-nums", i === 0 && "font-semibold text-foreground")}>
                  {texto(c, `${chave}-${r}-${i}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// "Sugestão do <agente> (08/11), resto do título": o resto continua visível no cabeçalho.
const RE_PREFIXO = /^Sugestão\s+d[ao]s?\s+\S+\s*\(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\)/i

function Entrada({ entrada, indice }: { entrada: EntradaNota; indice: number }) {
  const descartada = entrada.descartada === true || /DESCARTAD/i.test(entrada.titulo ?? "")
  // O resto do título só aparece quando há autor; sem autor o título inteiro já está no cabeçalho.
  const resto = (entrada.autor ? (entrada.titulo ?? "") : "")
    .replace(RE_PREFIXO, "")
    .replace(/\[DESCARTAD[AO][^\]]*\]/i, "")
    .replace(/^[,\s]+/, "")
    .trim()
  const rotuloTitulo = entrada.autor ? ["Sugestão", entrada.data].filter(Boolean).join(" · ") : null

  const corpo = (
    <div className="space-y-4 pt-4">
      {entrada.introducao.length > 0 && (
        <p className="max-w-4xl text-[14px] leading-relaxed text-foreground/90 [&_strong]:font-bold [&_strong]:text-primary">
          {texto(entrada.introducao.join(" "), `intro${indice}`)}
        </p>
      )}

      {entrada.destaques.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entrada.destaques.map((d, i) => (
            // card 10% menor (zoom) e texto de destaque mais 10% menor
            <div key={`${indice}-${i}`} className={cn(CARD, "space-y-1.5 [zoom:0.9]")}>
              <p className={ROTULO}>{d.rotulo}</p>
              <p className="text-[21.6px] leading-tight font-bold tracking-tight break-words">{d.valor}</p>
              {/* legenda também passa pelos selos ([HIP], [FATO], não encontrado) */}
              <p className="text-[12px] leading-snug text-muted-foreground">{texto(d.legenda, `d${indice}-${i}`)}</p>
            </div>
          ))}
        </div>
      )}

      {entrada.tabelas.map((t, i) => (
        <Tabela key={`t${i}`} tabela={t} chave={`t${indice}-${i}`} />
      ))}

      <div className="grid gap-3 lg:grid-cols-2">
        {entrada.grupos
          .filter((g) => g.itens.length > 0)
          .map((g) => (
            <ColunaGrupo key={g.titulo} grupo={g} />
          ))}
      </div>
    </div>
  )

  const cabecalho = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {entrada.autor && (
        <Badge variant="secondary" className="bg-[#B0C2C2] font-mono text-xs text-[#373634]">
          {entrada.autor}
        </Badge>
      )}
      <span className="text-[15px] font-bold text-foreground">{rotuloTitulo ?? (entrada.titulo ?? "").replace(/\s*\[DESCARTAD[AO][^\]]*\]/i, "")}</span>
      {resto && <span className="text-[13px] text-[#B0C2C2]">{resto}</span>}
      {descartada && <span className={cn(ESTILO_ETIQUETA, "bg-red-400/20 text-red-300")}>Descartada</span>}
    </div>
  )

  // Entradas descartadas ficam recolhidas, sem ocupar a tela; as demais abrem direto.
  return (
    <details open={!descartada} className={cn("group rounded-2xl p-4 ring-1 ring-foreground/10", descartada && "opacity-60")}>
      <summary className="cursor-pointer list-none border-b border-foreground/10 pb-3 [&::-webkit-details-marker]:hidden">
        {cabecalho}
      </summary>
      {corpo}
    </details>
  )
}

export function NotasEstruturadas({ entradas }: { entradas: EntradaNota[] }) {
  return (
    <div className="space-y-6">
      {entradas.map((e, i) => (
        <Entrada key={`${i}-${e.titulo ?? ""}`} entrada={e} indice={i} />
      ))}
    </div>
  )
}
