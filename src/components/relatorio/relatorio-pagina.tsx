// Relatório de uma página: leitura com hierarquia tipográfica (título grande, painel de números,
// blocos por grupo, coleções em cards). Só exibe; a edição fica no modal (ver pagina-relatorio.tsx).
import * as React from "react"

import { Anel, Bloco, CARD, Indicador, ROTULO } from "@/components/relatorio/pecas"
import { CabecalhoPagina } from "@/components/relatorio/cabecalho-pagina"
import { NotasEstruturadas } from "@/components/relatorio/notas-estruturadas"
import { CelulaItem } from "@/components/relatorio/celula-item"
import { GavetaItem, type AcaoDoItem } from "@/components/relatorio/gaveta-item"
import { CampoNaoPreenchido } from "@/components/relatorio/nao-preenchido"
import { ordenarItens } from "@/components/cards/collection-section"
import { StatusBadge } from "@/components/cards/status-badge"
import { textoDoValor } from "@/components/cards/field-value"
import { autorLegivel, estaVazio, formatarDataCurta, nuncaSalvo } from "@/components/cards/valores"
import { gruposDeCampos, type PageEditorProps } from "@/components/editor/page-editor"
import { Badge } from "@/components/ui/badge"
import { calcularCompletude } from "@/lib/content/completude"
import type { CollectionDef, FieldDef, PageDefinition } from "@/lib/content/schemas/field-types"
import type { ContentDoc, Item, ResumoCalculado, ValorCampo } from "@/lib/content/types"
import { formatarMoeda, formatarNumero } from "@/lib/format"
import { analisarNotas } from "@/lib/markdown/notas"
import { renderMarkdownSimples } from "@/lib/markdown/render-simples"
import { cn } from "@/lib/utils"

export interface RelatorioPaginaProps {
  documento: ContentDoc
  definicao: PageDefinition
  resumos: Record<string, ResumoCalculado[]>
  /** Botões do cabeçalho (Editar, Aprovar). */
  acoes?: React.ReactNode
  /** Salva um item editado na gaveta lateral; sem ela os cards ficam só para leitura. */
  onSalvar?: PageEditorProps["onSalvar"]
  /** Ações extras na gaveta, por nome de coleção (ex.: leads → "Criar oportunidade"). */
  acoesDoItem?: Record<string, AcaoDoItem>
}

function formatarResumo(r: ResumoCalculado): string {
  return r.formato === "moeda" ? formatarMoeda(r.valor) : formatarNumero(r.valor)
}

// ---------- Campos ----------

/** Rótulo dos cartões de campo (20% menor que o rótulo dos indicadores). */
const ROTULO_CAMPO = "text-[9px] font-medium tracking-[0.14em] text-muted-foreground uppercase"

/** Cartão de um campo de valor único; o tamanho do texto acompanha a importância do tipo. */
function CartaoCampo({ campo, valor }: { campo: FieldDef; valor: ValorCampo }) {
  if (estaVazio(valor)) return <CampoNaoPreenchido rotulo={campo.rotulo} />

  const largo = campo.tipo === "texto-longo" || campo.tipo === "lista-texto"

  return (
    <div className={cn(CARD, "space-y-2", largo && "sm:col-span-2 lg:col-span-2")}>
      <p className={ROTULO_CAMPO}>{campo.rotulo}</p>

      {(campo.tipo === "numero" || campo.tipo === "moeda") && (
        <p className="text-2xl leading-tight font-bold tracking-tight tabular-nums break-words">
          {textoDoValor(campo, valor)}
        </p>
      )}

      {campo.tipo === "selecao" && <Badge className="text-xs">{textoDoValor(campo, valor)}</Badge>}

      {(campo.tipo === "texto-curto" || campo.tipo === "data") && (
        /* Frases longas ficam mais leves; valores curtos (nome, data) ganham destaque */
        <p
          className={cn(
            "leading-snug break-words",
            textoDoValor(campo, valor).length > 40 ? "text-[13px] font-medium" : "text-sm font-semibold",
          )}
        >
          {textoDoValor(campo, valor)}
        </p>
      )}

      {campo.tipo === "texto-longo" && (
        <p className="text-[13px] leading-relaxed whitespace-pre-line break-words">{textoDoValor(campo, valor)}</p>
      )}

      {campo.tipo === "lista-texto" && Array.isArray(valor) && (
        <ol className="space-y-2">
          {valor.map((linha, i) => (
            <li key={`${i}-${linha}`} className="flex gap-3 text-[13px] leading-snug break-words">
              <span className="w-6 shrink-0 pt-0.5 text-[10px] font-semibold text-primary tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              {/* min-w-0 + overflow-wrap:anywhere: URLs longas quebram em vez de estourar o cartão */}
              <span className="min-w-0 [overflow-wrap:anywhere]">{linha}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ---------- Coleções ----------

/** Props de um card clicável: abre a gaveta lateral do item. */
interface CartaoClicavel {
  onAbrir?: () => void
}

/** Atributos que tornam um card inteiro clicável e acessível pelo teclado (Enter ou Espaço). */
function propsClicaveis(onAbrir: (() => void) | undefined, rotulo: string) {
  if (!onAbrir) return {}
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-label": `Abrir ${rotulo}`,
    onClick: onAbrir,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onAbrir()
      }
    },
  }
}

const CLASSE_CLICAVEL =
  "cursor-pointer transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"

/** Quantos gatilhos aparecem como chip no card da persona; o resto vira "+N" (a gaveta mostra todos). */
const CHIPS_VISIVEIS = 3

/** Card de persona: número, nome grande, frase em destaque, perfil em cinza, momento com filete e gatilhos em chips. */
export function CartaoPersona({ colecao, item, indice, onAbrir }: { colecao: CollectionDef; item: Item; indice: number } & CartaoClicavel) {
  const lista = colecao.lista
  const campo = (nome?: string) => colecao.campos.find((c) => c.nome === nome)
  const texto = (nome?: string) => {
    const c = campo(nome)
    return c && !estaVazio(item[c.nome]) ? textoDoValor(c, item[c.nome]) : null
  }
  const titulo = texto(colecao.campoTitulo) ?? colecao.rotuloItem
  const frase = texto(colecao.campoSubtitulo)
  const perfil = texto(lista?.apoioTitulo)
  const momento = texto(lista?.texto)
  const campoChips = campo(lista?.chips)
  const valorChips = campoChips ? item[campoChips.nome] : null
  const chips = Array.isArray(valorChips) ? valorChips : []
  const resto = chips.length - CHIPS_VISIVEIS

  return (
    <article {...propsClicaveis(onAbrir, titulo)} className={cn(CARD, "space-y-4 outline-none", onAbrir && CLASSE_CLICAVEL)}>
      <header className="flex items-start gap-4">
        <span
          aria-hidden
          className="w-12 shrink-0 text-4xl leading-none font-bold text-primary tabular-nums"
        >
          {String(indice + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-lg leading-tight font-bold break-words">{titulo}</h3>
          {frase && <p className="text-sm leading-snug font-medium break-words text-primary">{frase}</p>}
          {perfil && <p className="text-xs leading-snug break-words text-muted-foreground">{perfil}</p>}
        </div>
      </header>

      {momento && (
        <div className="space-y-1 border-l-2 border-primary/40 pl-3">
          <p className={ROTULO_CAMPO}>{campo(lista?.texto)?.rotulo}</p>
          <p className="line-clamp-3 text-[13px] leading-relaxed break-words">{momento}</p>
        </div>
      )}

      {chips.length > 0 && (
        <div className="space-y-2">
          <p className={ROTULO_CAMPO}>{campoChips?.rotulo}</p>
          <ul className="flex flex-wrap gap-2">
            {chips.slice(0, CHIPS_VISIVEIS).map((g, i) => (
              <li key={i} title={String(g)} className="max-w-full truncate rounded-full bg-foreground/10 px-3 py-1 text-xs">
                {String(g)}
              </li>
            ))}
            {resto > 0 && (
              <li className="rounded-full px-3 py-1 text-xs text-muted-foreground ring-1 ring-foreground/25">+{resto}</li>
            )}
          </ul>
        </div>
      )}
    </article>
  )
}

/** Item em card de lista (um por linha): título, apoio, subtítulo, texto e os dados curtos no rodapé/lado direito. */
function CartaoLista({ colecao, item, onAbrir }: { colecao: CollectionDef; item: Item } & CartaoClicavel) {
  const lista = colecao.lista
  const campo = (nome?: string) => colecao.campos.find((c) => c.nome === nome)
  const texto = (nome?: string) => {
    const c = campo(nome)
    return c && !estaVazio(item[c.nome]) ? textoDoValor(c, item[c.nome]) : null
  }
  const titulo = texto(colecao.campoTitulo) ?? colecao.rotuloItem
  const destaque = campo(colecao.campoDestaque)
  const meta = (lista?.meta ?? []).map(campo).filter((c): c is FieldDef => Boolean(c))

  return (
    <article {...propsClicaveis(onAbrir, titulo)} className={cn(CARD, "outline-none", onAbrir && CLASSE_CLICAVEL)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm leading-snug font-bold break-words">{titulo}</h3>
          {texto(lista?.apoioTitulo) && <p className="text-xs break-words text-muted-foreground">{texto(lista?.apoioTitulo)}</p>}
          {texto(colecao.campoSubtitulo) && <p className="text-[13px] font-medium break-words">{texto(colecao.campoSubtitulo)}</p>}
          {texto(lista?.texto) && (
            <p className="line-clamp-2 pt-1 text-[13px] leading-snug break-words text-muted-foreground">{texto(lista?.texto)}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] md:max-w-[22rem] md:shrink-0 md:justify-end">
          {destaque && <CelulaItem campo={destaque} valor={item[destaque.nome] ?? null} />}
          {meta.map((c) => (
            <span key={c.nome} title={c.rotulo}>
              <CelulaItem campo={c} valor={item[c.nome] ?? null} />
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}

function CartaoItem({ colecao, item, onAbrir }: { colecao: CollectionDef; item: Item } & CartaoClicavel) {
  const campoTitulo = colecao.campos.find((c) => c.nome === colecao.campoTitulo)
  const campoSubtitulo = colecao.campos.find((c) => c.nome === colecao.campoSubtitulo)
  const campoDestaque = colecao.campos.find((c) => c.nome === colecao.campoDestaque)
  const demais = colecao.campos.filter(
    (c) =>
      c.nome !== colecao.campoTitulo &&
      c.nome !== colecao.campoSubtitulo &&
      c.nome !== colecao.campoDestaque &&
      !estaVazio(item[c.nome]),
  )
  const titulo = campoTitulo && !estaVazio(item[campoTitulo.nome]) ? textoDoValor(campoTitulo, item[campoTitulo.nome]) : colecao.rotuloItem

  return (
    // zoom 0.9: reduz o card inteiro em 10%, de forma proporcional
    <article {...propsClicaveis(onAbrir, titulo)} className={cn(CARD, "space-y-4 [zoom:0.9] outline-none", onAbrir && CLASSE_CLICAVEL)}>
      <header className="space-y-1.5">
        {campoDestaque && !estaVazio(item[campoDestaque.nome]) && (
          // "Hipótese" ganha caixa verde (cor primária da marca); os demais valores seguem em contorno
          <Badge
            variant="outline"
            className={cn(item[campoDestaque.nome] === "hipotese" && "border-transparent bg-primary text-primary-foreground")}
          >
            {textoDoValor(campoDestaque, item[campoDestaque.nome])}
          </Badge>
        )}
        <h3 className="text-[13.8px] leading-snug font-semibold break-words uppercase">{titulo}</h3>
        {campoSubtitulo && !estaVazio(item[campoSubtitulo.nome]) && (
          <p className="text-sm text-muted-foreground break-words">{textoDoValor(campoSubtitulo, item[campoSubtitulo.nome])}</p>
        )}
      </header>
      {demais.length > 0 && (
        <dl className="space-y-2.5 border-t pt-3">
          {demais.map((c) => {
            const longo = c.tipo === "texto-longo" || c.tipo === "lista-texto"
            return (
              <div key={c.nome} className={cn("gap-x-3 text-sm", longo ? "space-y-1" : "flex items-baseline justify-between")}>
                <dt className="shrink-0 text-xs text-muted-foreground">{c.rotulo}</dt>
                <dd className={cn("break-words", !longo && "text-right font-medium tabular-nums", longo && "whitespace-pre-line")}>
                  {textoDoValor(c, item[c.nome])}
                </dd>
              </div>
            )
          })}
        </dl>
      )}
    </article>
  )
}

function BlocoColecao({
  colecao,
  itens,
  resumos,
  atualizadoEm,
  onSalvar,
  acao,
}: {
  colecao: CollectionDef
  itens: Item[]
  resumos: ResumoCalculado[]
  atualizadoEm: string
  /** Sem esta callback os cards não abrem a gaveta (só leitura). */
  onSalvar?: PageEditorProps["onSalvar"]
  acao?: AcaoDoItem
}) {
  const ordenados = ordenarItens(itens, colecao)
  const [abertoId, setAbertoId] = React.useState<string | null>(null)
  const aberto = ordenados.find((i) => i.id === abertoId)
  const abrir = (id: string) => (onSalvar ? () => setAbertoId(id) : undefined)
  return (
    <Bloco
      etiqueta={colecao.rotulo}
      detalhe={`${itens.length} ${itens.length === 1 ? "item" : "itens"}`}
      descricao={colecao.descricao}
    >
      {resumos.length > 0 && (
        <div className={cn("grid gap-3 sm:grid-cols-2", resumos.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {resumos.map((r) => (
            <Indicador key={r.rotulo} rotulo={r.rotulo} valor={formatarResumo(r)} />
          ))}
        </div>
      )}
      {ordenados.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground italic">
          Nenhum {colecao.rotuloItem.toLowerCase()} ainda.
        </p>
      ) : colecao.lista ? (
        // Lista: um card por linha em todas as telas (sem tabela)
        <div className="space-y-3">
          {ordenados.map((item, i) =>
            colecao.lista?.variante === "persona" ? (
              <CartaoPersona key={item.id} colecao={colecao} item={item} indice={i} onAbrir={abrir(item.id)} />
            ) : (
              <CartaoLista key={item.id} colecao={colecao} item={item} onAbrir={abrir(item.id)} />
            ),
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordenados.map((item) => (
            <CartaoItem key={item.id} colecao={colecao} item={item} onAbrir={abrir(item.id)} />
          ))}
        </div>
      )}
      {onSalvar && (
        <GavetaItem
          colecao={colecao}
          item={aberto}
          onFechar={() => setAbertoId(null)}
          atualizadoEm={atualizadoEm}
          onSalvar={onSalvar}
          acao={acao}
        />
      )}
    </Bloco>
  )
}

// ---------- Relatório ----------

export function RelatorioPagina({ documento, definicao, resumos, acoes, onSalvar, acoesDoItem }: RelatorioPaginaProps) {
  const completude = calcularCompletude(documento, definicao)
  const grupos = gruposDeCampos(definicao.campos)
  // Notas com estrutura (entradas, grupos, "Rótulo: texto") ganham o layout de cartões; o resto continua texto corrido
  const entradasNotas = analisarNotas(documento.corpo)
  const pendentes = definicao.campos.filter((c) => estaVazio(documento.campos[c.nome])).length

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-10">
      {/* Capa: etiqueta, título grande, descrição e ações */}
      <CabecalhoPagina
        titulo={documento.titulo}
        descricao={documento.descricao}
        acoes={
          <>
            <StatusBadge status={documento.status} />
            {acoes}
          </>
        }
      >
        <p className="text-xs text-muted-foreground">
          {nuncaSalvo(documento.atualizado_em)
            ? "Ainda não editado"
            : `Atualizado em ${formatarDataCurta(documento.atualizado_em)} por ${autorLegivel(documento.atualizado_por)}`}
        </p>
      </CabecalhoPagina>

      {/* Painel de números */}
      <Bloco etiqueta="Panorama">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className={cn(CARD, "flex items-center gap-4")}>
            <Anel percentual={completude.percentual} />
            <div className="space-y-1">
              <p className={ROTULO}>Completude</p>
              <p className="text-4xl leading-none font-bold tabular-nums">
                {completude.percentual}
                <span className="text-base font-medium text-muted-foreground">%</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {completude.preenchidos} de {completude.total} itens
              </p>
            </div>
          </div>
          <Indicador rotulo="Campos pendentes" valor={String(pendentes)} sufixo={`de ${definicao.campos.length}`} />
          {(definicao.colecoes ?? []).map((c) => (
            <Indicador
              key={c.nome}
              rotulo={c.rotulo}
              valor={String(documento.itens.filter((i) => i.colecao === c.nome).length)}
            />
          ))}
        </div>
      </Bloco>

      {/* Campos, um bloco por grupo temático */}
      {grupos.map((grupo, i) => (
        <Bloco key={`${grupo.titulo}-${i}`} etiqueta={grupo.titulo}>
          <div className="grid grid-flow-dense gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grupo.campos.map((campo) => (
              <CartaoCampo key={campo.nome} campo={campo} valor={documento.campos[campo.nome] ?? null} />
            ))}
          </div>
        </Bloco>
      ))}

      {/* Coleções */}
      {definicao.colecoes?.map((colecao) => (
        <BlocoColecao
          key={colecao.nome}
          colecao={colecao}
          itens={documento.itens.filter((i) => i.colecao === colecao.nome)}
          resumos={resumos[colecao.nome] ?? []}
          atualizadoEm={documento.atualizado_em}
          onSalvar={onSalvar}
          acao={acoesDoItem?.[colecao.nome]}
        />
      ))}

      {/* Notas */}
      {documento.corpo.trim() !== "" && (
        <Bloco etiqueta="Notas">
          {entradasNotas ? (
            <NotasEstruturadas entradas={entradasNotas} />
          ) : (
            <div className="max-w-3xl text-base [&_*]:text-base">{renderMarkdownSimples(documento.corpo)}</div>
          )}
        </Bloco>
      )}
    </div>
  )
}
