"use client"

// Editor de uma página do BusinessOS (§8.3). Dono do RASCUNHO local: campos, itens, notas e status.
// Monta o patch mínimo, salva pela callback `onSalvar` (a página liga a Server Action),
// trata conflito com edição de agentes e avisa antes de sair com alterações pendentes.
import * as React from "react"
import Link from "next/link"
import { BarChart3, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { CardCollection } from "@/components/cards/card-collection"
import { CollectionSection } from "@/components/cards/collection-section"
import { FieldCard } from "@/components/cards/field-card"
import { StatusSelect } from "@/components/cards/status-select"
import { autorLegivel, formatarDataCurta, nuncaSalvo, valoresIguais } from "@/components/cards/valores"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { calcularCompletude } from "@/lib/content/completude"
import type { CodigoErro } from "@/lib/content/errors"
import { hrefDoDocumento, obterPagina } from "@/lib/content/navigation"
import { valorVazio } from "@/lib/content/schemas/build"
import type { FieldDef, PageDefinition } from "@/lib/content/schemas/field-types"
import type { ContentDoc, DocPatch, Item, ResumoCalculado, Status, ValorCampo } from "@/lib/content/types"
import { formatarDataHora } from "@/lib/format"

import { MarkdownNotes } from "./markdown-notes"
import { SaveBar } from "./save-bar"

/**
 * Resultado da Server Action salvarDocumento (§6.2). Declarado aqui de forma estrutural
 * porque componentes não importam actions.ts (D14); o tipo de lá é compatível com este.
 */
export type ResultadoAcao =
  | { ok: true; documento: ContentDoc }
  | {
      ok: false
      erro: {
        codigo: CodigoErro
        mensagem: string
        /** Erros por caminho ("campos.preco", "itens.2.nome"). */
        campos?: Record<string, string>
      }
      /** Presente em CONFLITO. */
      documentoAtual?: ContentDoc
    }

export interface PageEditorProps {
  documento: ContentDoc
  definicao: PageDefinition
  /** Resumos já calculados no servidor, por nome de coleção. */
  resumos: Record<string, ResumoCalculado[]>
  onSalvar: (patch: DocPatch, esperadoAtualizadoEm?: string) => Promise<ResultadoAcao>
  /** Dentro de um modal: sem título da página nem margens próprias (o modal já traz o título). */
  emModal?: boolean
  /** Avisa quando passa a existir (ou deixa de existir) alteração não salva. */
  onPendenteChange?: (pendente: boolean) => void
  /** Chamado depois de um salvamento bem-sucedido (o relatório usa para fechar o modal). */
  onSalvo?: () => void
  /** "Pedir à IA": sugere valores para campos vazios. Sem esta callback o botão não aparece. */
  onPedirIA?: () => Promise<ResultadoSugestaoIA>
  /** "Gerar relatório": devolve texto para as notas. Sem esta callback o botão não aparece. */
  onGerarRelatorio?: () => Promise<ResultadoRelatorioIA>
}

/** Resultados das Server Actions de IA (declarados aqui pelo mesmo motivo de ResultadoAcao). */
export type ResultadoSugestaoIA = { ok: true; campos: Record<string, ValorCampo> } | { ok: false; mensagem: string }
export type ResultadoRelatorioIA = { ok: true; texto: string } | { ok: false; mensagem: string }

/** Parte editável do documento. */
interface Rascunho {
  campos: Record<string, ValorCampo>
  itens: Item[]
  corpo: string
  status: Status
}

function rascunhoDe(doc: ContentDoc): Rascunho {
  return { campos: { ...doc.campos }, itens: doc.itens, corpo: doc.corpo, status: doc.status }
}

/** Itens iguais campo a campo (ordem de chaves não importa). */
function itensIguais(a: Item, b: Item): boolean {
  const chaves = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const chave of chaves) {
    if (!valoresIguais(a[chave], b[chave])) return false
  }
  return true
}

interface Diferencas {
  patch: DocPatch
  quantidade: number
  camposAlterados: Set<string>
  pendentes: Record<string, "novo" | "editado">
}

/** Patch mínimo entre a base salva e o rascunho (§8.3). */
function calcularDiferencas(base: ContentDoc, rascunho: Rascunho, definicao: PageDefinition): Diferencas {
  const patch: DocPatch = {}
  const camposAlterados = new Set<string>()
  const pendentes: Record<string, "novo" | "editado"> = {}

  for (const campo of definicao.campos) {
    if (!valoresIguais(rascunho.campos[campo.nome], base.campos[campo.nome])) {
      camposAlterados.add(campo.nome)
    }
  }
  if (camposAlterados.size > 0) {
    patch.campos = Object.fromEntries(
      [...camposAlterados].map((nome) => [nome, rascunho.campos[nome] ?? null]),
    )
  }

  const basePorId = new Map(base.itens.map((item) => [item.id, item]))
  const itensAlterados: Item[] = []
  for (const item of rascunho.itens) {
    const original = basePorId.get(item.id)
    if (!original) {
      pendentes[item.id] = "novo"
      itensAlterados.push(item)
    } else if (!itensIguais(original, item)) {
      pendentes[item.id] = "editado"
      itensAlterados.push(item)
    }
  }
  if (itensAlterados.length > 0) patch.itens = itensAlterados

  const idsRascunho = new Set(rascunho.itens.map((item) => item.id))
  const removidos = base.itens.filter((item) => !idsRascunho.has(item.id)).map((item) => item.id)
  if (removidos.length > 0) patch.itens_remover = removidos

  if (rascunho.corpo !== base.corpo) patch.corpo = rascunho.corpo
  if (rascunho.status !== base.status) patch.status = rascunho.status

  const quantidade =
    camposAlterados.size +
    itensAlterados.length +
    removidos.length +
    (patch.corpo !== undefined ? 1 : 0) +
    (patch.status !== undefined ? 1 : 0)

  return { patch, quantidade, camposAlterados, pendentes }
}

const MENSAGEM_SAIR = "Você tem alterações não salvas. Sair mesmo assim?"

/** Agrupa campos consecutivos pelo `grupo` (sem grupo → "Campos"), preservando a ordem. */
export function gruposDeCampos(campos: readonly FieldDef[]) {
  const grupos: Array<{ titulo: string; campos: FieldDef[] }> = []
  for (const campo of campos) {
    const titulo = campo.grupo ?? "Campos"
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.titulo === titulo) ultimo.campos.push(campo)
    else grupos.push({ titulo, campos: [campo] })
  }
  return grupos
}

export function PageEditor({
  documento,
  definicao,
  resumos,
  onSalvar,
  emModal = false,
  onPendenteChange,
  onSalvo,
  onPedirIA,
  onGerarRelatorio,
}: PageEditorProps) {
  const [base, setBase] = React.useState(documento)
  const [rascunho, setRascunho] = React.useState(() => rascunhoDe(documento))
  const [errosCampos, setErrosCampos] = React.useState<Record<string, string>>({})
  const [conflito, setConflito] = React.useState<ContentDoc | null>(null)
  const [confirmandoDescarte, setConfirmandoDescarte] = React.useState(false)
  const [salvando, iniciarTransicao] = React.useTransition()
  const [ia, setIa] = React.useState<"pedir" | "gerar" | null>(null)

  const { patch, quantidade, camposAlterados, pendentes } = React.useMemo(
    () => calcularDiferencas(base, rascunho, definicao),
    [base, rascunho, definicao],
  )
  const temAlteracoes = quantidade > 0

  // Avisa quem hospeda o editor (modal) sobre pendências
  React.useEffect(() => {
    onPendenteChange?.(temAlteracoes)
  }, [temAlteracoes, onPendenteChange])

  // As props trouxeram outra versão (o servidor revalidou): adota se não houver pendências.
  // versaoVista acompanha só as props (ajuste durante o render, sem efeito).
  const [versaoVista, setVersaoVista] = React.useState(documento.atualizado_em)
  if (documento.atualizado_em !== versaoVista) {
    setVersaoVista(documento.atualizado_em)
    if (!temAlteracoes) {
      setBase(documento)
      setRascunho(rascunhoDe(documento))
    }
  }

  // Rascunho mais recente, para saber se a pessoa editou durante o salvamento
  const rascunhoRef = React.useRef(rascunho)
  React.useEffect(() => {
    rascunhoRef.current = rascunho
  }, [rascunho])

  const { secao } = obterPagina(documento.id)
  const completude = calcularCompletude(
    { ...base, campos: rascunho.campos, itens: rascunho.itens, corpo: rascunho.corpo },
    definicao,
  )

  // ---------- Edição do rascunho ----------

  const alterarCampo = (nome: string, valor: ValorCampo) => {
    setRascunho((atual) => ({ ...atual, campos: { ...atual.campos, [nome]: valor } }))
    if (nome in errosCampos) {
      setErrosCampos((atuais) => {
        const resto = { ...atuais }
        delete resto[nome]
        return resto
      })
    }
  }

  // ---------- IA: tudo cai no rascunho; nada é salvo até a pessoa clicar em Salvar ----------

  const pedirIA = async () => {
    if (!onPedirIA || ia) return
    setIa("pedir")
    try {
      const r = await onPedirIA()
      if (!r.ok) return void toast.error(r.mensagem)
      // Só preenche o que continua vazio no rascunho (nunca sobrescreve o que a pessoa digitou)
      const aplicados = Object.keys(r.campos).filter((n) => valorVazio(rascunhoRef.current.campos[n]))
      if (aplicados.length === 0) return void toast.info("A IA não encontrou base no contexto para sugerir campos.")
      setRascunho((atual) => ({
        ...atual,
        campos: {
          ...atual.campos,
          ...Object.fromEntries(aplicados.filter((n) => valorVazio(atual.campos[n])).map((n) => [n, r.campos[n]])),
        },
      }))
      toast.success(`${aplicados.length} campo(s) sugerido(s). Revise e salve.`)
    } finally {
      setIa(null)
    }
  }

  const gerarRelatorio = async () => {
    if (!onGerarRelatorio || ia) return
    setIa("gerar")
    try {
      const r = await onGerarRelatorio()
      if (!r.ok) return void toast.error(r.mensagem)
      // Acrescenta ao fim das notas, sem apagar o que já existe
      setRascunho((atual) => ({ ...atual, corpo: atual.corpo.trim() ? `${atual.corpo.trimEnd()}\n\n${r.texto}` : r.texto }))
      toast.success("Relatório adicionado às notas. Revise e salve.")
    } finally {
      setIa(null)
    }
  }

  const salvarItem = (item: Item) => {
    setRascunho((atual) => {
      const existe = atual.itens.some((i) => i.id === item.id)
      return {
        ...atual,
        itens: existe ? atual.itens.map((i) => (i.id === item.id ? item : i)) : [...atual.itens, item],
      }
    })
  }

  const removerItem = (itemId: string) => {
    setRascunho((atual) => ({ ...atual, itens: atual.itens.filter((i) => i.id !== itemId) }))
  }

  const adotar = (doc: ContentDoc) => {
    setBase(doc)
    setRascunho(rascunhoDe(doc))
    setErrosCampos({})
  }

  // ---------- Salvamento ----------

  /** Nome legível do item citado em "itens.<i>.<campo>" (índice no patch enviado). */
  const nomeDoItem = (patchEnviado: DocPatch, indice: number): string => {
    const item = patchEnviado.itens?.[indice]
    const colecao = definicao.colecoes?.find((c) => c.nome === item?.colecao)
    const titulo = colecao && item ? item[colecao.campoTitulo] : undefined
    if (typeof titulo === "string" && titulo.trim() !== "") return titulo
    return colecao?.rotuloItem ?? "Item"
  }

  const salvar = (comPrecondicao = true) => {
    if (!temAlteracoes || salvando) return
    const patchEnviado = patch
    const rascunhoEnviado = rascunho
    const esperado = comPrecondicao ? base.atualizado_em : undefined

    iniciarTransicao(async () => {
      const resultado = await onSalvar(patchEnviado, esperado)

      if (resultado.ok) {
        setConflito(null)
        setErrosCampos({})
        setBase(resultado.documento)
        // Só troca o rascunho se a pessoa não editou nada enquanto salvava
        if (rascunhoRef.current === rascunhoEnviado) setRascunho(rascunhoDe(resultado.documento))
        toast.success("Alterações salvas.")
        onSalvo?.()
        return
      }

      const { erro } = resultado
      if (erro.codigo === "CONFLITO" && resultado.documentoAtual) {
        setConflito(resultado.documentoAtual)
        return
      }
      if (erro.codigo === "PAYLOAD_INVALIDO" && erro.campos) {
        const porCampo: Record<string, string> = {}
        for (const [caminho, mensagem] of Object.entries(erro.campos)) {
          const partes = caminho.split(".")
          if (partes[0] === "campos" && partes[1]) {
            porCampo[partes[1]] = mensagem
          } else if (partes[0] === "itens" && partes[1]) {
            toast.error(`${nomeDoItem(patchEnviado, Number(partes[1]))}: ${mensagem}`)
          } else {
            toast.error(mensagem)
          }
        }
        setErrosCampos(porCampo)
        toast.error("Corrija os campos destacados.")
        return
      }
      toast.error(erro.mensagem)
    })
  }

  // ⌘S / Ctrl+S salva (sem abrir o "Salvar página" do navegador)
  const aoAtalhoSalvar = React.useEffectEvent((evento: KeyboardEvent) => {
    if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === "s") {
      evento.preventDefault()
      salvar()
    }
  })
  React.useEffect(() => {
    const ouvinte = (evento: KeyboardEvent) => aoAtalhoSalvar(evento)
    window.addEventListener("keydown", ouvinte)
    return () => window.removeEventListener("keydown", ouvinte)
  }, [])

  // Sair com pendências (RF-15): recarregar/fechar aba e cliques em links internos
  React.useEffect(() => {
    if (!temAlteracoes) return

    const antesDeSair = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
      evento.returnValue = ""
    }

    const aoClicar = (evento: MouseEvent) => {
      if (evento.defaultPrevented || evento.button !== 0) return
      if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return
      const alvo = evento.target instanceof Element ? evento.target.closest("a[href]") : null
      if (!(alvo instanceof HTMLAnchorElement) || alvo.target || alvo.hasAttribute("download")) return
      const destino = new URL(alvo.href, window.location.href)
      if (destino.origin !== window.location.origin) return
      // Âncora na mesma página não sai do editor
      if (destino.pathname === window.location.pathname && destino.search === window.location.search) return
      if (!window.confirm(MENSAGEM_SAIR)) {
        evento.preventDefault()
        evento.stopPropagation()
      }
    }

    window.addEventListener("beforeunload", antesDeSair)
    document.addEventListener("click", aoClicar, true)
    return () => {
      window.removeEventListener("beforeunload", antesDeSair)
      document.removeEventListener("click", aoClicar, true)
    }
  }, [temAlteracoes])

  // ---------- Render ----------

  return (
    <div className={emModal ? "space-y-8" : "mx-auto w-full max-w-5xl space-y-8 px-4 py-6 md:px-8 md:py-8"}>
      {/* 1. Cabeçalho */}
      <header className="space-y-3">
        {!emModal && (
          <>
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{secao.titulo}</p>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight break-words md:text-3xl">{documento.titulo}</h1>
              <p className="text-sm text-muted-foreground">{documento.descricao}</p>
            </div>
          </>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <StatusSelect
            value={rascunho.status}
            onValueChange={(status) => setRascunho((atual) => ({ ...atual, status }))}
            disabled={salvando}
          />
          <span className="tabular-nums">Completude: {completude.percentual}%</span>
          <span>
            {nuncaSalvo(base.atualizado_em)
              ? "Ainda não editado"
              : `Atualizado em ${formatarDataCurta(base.atualizado_em)} por ${autorLegivel(base.atualizado_por)}`}
          </span>
        </div>
        {(onPedirIA || onGerarRelatorio) && (
          <div className="flex flex-wrap items-center gap-2">
            {onPedirIA && (
              <Button
                type="button"
                variant="outline"
                onClick={pedirIA}
                disabled={ia !== null || salvando}
                aria-busy={ia === "pedir"}
                className="h-11 md:h-9"
              >
                <Sparkles aria-hidden />
                {ia === "pedir" ? "Pensando…" : "Pedir à IA"}
              </Button>
            )}
            {onGerarRelatorio && (
              <Button
                type="button"
                onClick={gerarRelatorio}
                disabled={ia !== null || salvando}
                aria-busy={ia === "gerar"}
                className="h-11 md:h-9"
              >
                <BarChart3 aria-hidden />
                {ia === "gerar" ? "Gerando…" : "Gerar relatório"}
              </Button>
            )}
            {ia && <span className="text-xs text-muted-foreground">Leva cerca de 1 minuto.</span>}
          </div>
        )}
        {base.relacionados.length > 0 && (
          <nav aria-label="Páginas relacionadas" className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Relacionadas:</span>
            {base.relacionados.map((idRelacionado) => {
              const rel = obterPagina(idRelacionado)
              return (
                <Badge key={idRelacionado} variant="outline" asChild className="h-7 px-2.5 md:h-6">
                  <Link href={hrefDoDocumento(idRelacionado)}>
                    {rel.pagina.titulo}
                    <span className="text-muted-foreground">· {rel.secao.nome}</span>
                  </Link>
                </Badge>
              )
            })}
          </nav>
        )}
      </header>

      {/* 2. Campos (um bloco por grupo temático; sem grupo = "Campos") */}
      {gruposDeCampos(definicao.campos).map((grupo, indice) => (
        <CardCollection
          key={`${grupo.titulo}-${indice}`}
          titulo={grupo.titulo}
          chavePreferencia={`${documento.id}#campos-${indice}`}
        >
          {grupo.campos.map((campo) => (
            <FieldCard
              key={campo.nome}
              campo={campo}
              valor={rascunho.campos[campo.nome] ?? null}
              onChange={(valor) => alterarCampo(campo.nome, valor)}
              modificado={camposAlterados.has(campo.nome)}
              erro={errosCampos[campo.nome]}
            />
          ))}
        </CardCollection>
      ))}

      {/* 3. Coleções */}
      {definicao.colecoes?.map((colecao) => (
        <CollectionSection
          key={colecao.nome}
          colecao={colecao}
          chavePreferencia={`${documento.id}#${colecao.nome}`}
          itens={rascunho.itens.filter((item) => item.colecao === colecao.nome)}
          pendentes={pendentes}
          resumos={resumos[colecao.nome] ?? []}
          onSalvarItem={salvarItem}
          onRemoverItem={removerItem}
        />
      ))}

      {/* 4. Notas */}
      <MarkdownNotes
        valor={rascunho.corpo}
        onChange={(corpo) => setRascunho((atual) => ({ ...atual, corpo }))}
        placeholder={definicao.placeholderNotas}
        modificado={rascunho.corpo !== base.corpo}
      />

      {/* 5. Barra de salvamento */}
      <SaveBar
        visivel={temAlteracoes || salvando}
        salvando={salvando}
        quantidade={quantidade}
        onSalvar={() => salvar()}
        onDescartar={() => setConfirmandoDescarte(true)}
      />

      {/* Descartar alterações */}
      <AlertDialog open={confirmandoDescarte} onOpenChange={setConfirmandoDescarte}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Descartar {quantidade} {quantidade === 1 ? "alteração" : "alterações"}?
            </AlertDialogTitle>
            <AlertDialogDescription>Isso não pode ser desfeito.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => adotar(base)}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Conflito: alguém (agente) salvou a página enquanto você editava (RF-16) */}
      <Dialog open={conflito !== null} onOpenChange={(aberto) => !aberto && setConflito(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Esta página mudou enquanto você editava</DialogTitle>
            <DialogDescription>
              {conflito &&
                `Alterado por ${conflito.atualizado_por} em ${formatarDataHora(conflito.atualizado_em)}.`}{" "}
              Salvar mesmo assim mantém o que a outra alteração fez nos campos que você não tocou.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="h-11 md:h-8"
              disabled={salvando}
              onClick={() => {
                if (conflito) adotar(conflito)
                setConflito(null)
              }}
            >
              Descartar minhas alterações
            </Button>
            <Button className="h-11 md:h-8" disabled={salvando} onClick={() => salvar(false)}>
              Salvar mesmo assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
