"use client"

// Input genérico gerado a partir da FieldDef (§8.2). Controlado: recebe `valor` e devolve
// o novo valor já no formato gravado (número, string, lista, null) por `onChange`.
//
// Acessibilidade: o pai renderiza a ajuda com id `${id}-ajuda` (quando `campo.ajuda` existe);
// este componente renderiza a mensagem de erro com id `${id}-erro` e liga os dois por aria-describedby.
import * as React from "react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { CampoMoeda, CampoNumero, FieldDef } from "@/lib/content/schemas/field-types"
import type { ValorCampo } from "@/lib/content/types"
import { parsearNumeroBR } from "@/lib/format"
import { cn } from "@/lib/utils"

import { valoresIguais } from "./valores"

export interface FieldInputProps {
  campo: FieldDef
  valor: ValorCampo
  onChange: (v: ValorCampo) => void
  id: string
  erro?: string
  disabled?: boolean
}

/** Valor sentinela do Select para "sem opção" (o Radix não aceita value=""). */
const SELECAO_VAZIA = "__vazio__"

// Controles mais altos: 48 px no mobile e 44 px no desktop (alvo de toque confortável)
const ALTURA_CONTROLE = "h-12 md:h-11"

/** Ids para aria-describedby (ajuda do pai, dica de lista e erro). */
function descritoPor(id: string, campo: FieldDef, temErro: boolean): string | undefined {
  const ids = [
    campo.ajuda ? `${id}-ajuda` : null,
    campo.tipo === "lista-texto" ? `${id}-dica` : null,
    temErro ? `${id}-erro` : null,
  ].filter(Boolean)
  return ids.length ? ids.join(" ") : undefined
}

export function FieldInput({ campo, valor, onChange, id, erro, disabled }: FieldInputProps) {
  // Texto digitado que não virou número (só número/moeda); o valor gravado não muda
  const [textoInvalido, setTextoInvalido] = React.useState(false)
  // Valor mudou por fora (descartar, salvar): esquece o erro de digitação
  const [valorVisto, setValorVisto] = React.useState(valor)
  if (!valoresIguais(valor, valorVisto)) {
    setValorVisto(valor)
    setTextoInvalido(false)
  }

  // Erro de faixa/inteiro é derivado do valor atual (o servidor também recusa ao salvar)
  const erroFaixa =
    (campo.tipo === "numero" || campo.tipo === "moeda") && typeof valor === "number"
      ? validarFaixa(campo, valor)
      : undefined
  const mensagemErro = erro ?? (textoInvalido ? "Número inválido." : erroFaixa)
  const comum = {
    id,
    disabled,
    "aria-invalid": mensagemErro ? true : undefined,
    "aria-describedby": descritoPor(id, campo, Boolean(mensagemErro)),
  } as const

  let controle: React.ReactNode
  switch (campo.tipo) {
    case "texto-curto":
      controle = (
        <Input
          {...comum}
          className={ALTURA_CONTROLE}
          value={typeof valor === "string" ? valor : ""}
          maxLength={campo.maxCaracteres ?? 200}
          placeholder={campo.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break

    case "texto-longo":
      controle = (
        <Textarea
          {...comum}
          className="field-sizing-content min-h-28"
          value={typeof valor === "string" ? valor : ""}
          maxLength={campo.maxCaracteres ?? 5000}
          placeholder={campo.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break

    case "numero":
    case "moeda":
      controle = (
        <InputNumerico
          {...comum}
          campo={campo}
          valor={typeof valor === "number" ? valor : null}
          onChange={onChange}
          onInvalido={setTextoInvalido}
        />
      )
      break

    case "lista-texto":
      controle = (
        <TextareaLista
          {...comum}
          placeholder={campo.placeholder}
          valor={Array.isArray(valor) ? valor : []}
          onChange={onChange}
        />
      )
      break

    case "selecao":
      controle = (
        <Select
          value={typeof valor === "string" && valor !== "" ? valor : SELECAO_VAZIA}
          onValueChange={(v) => onChange(v === SELECAO_VAZIA ? null : v)}
          disabled={disabled}
        >
          <SelectTrigger
            id={id}
            aria-invalid={comum["aria-invalid"]}
            aria-describedby={comum["aria-describedby"]}
            className={cn("w-full", ALTURA_CONTROLE, "data-[size=default]:h-12 md:data-[size=default]:h-11")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECAO_VAZIA} className="min-h-11 text-muted-foreground md:min-h-8">
              — Não definido —
            </SelectItem>
            {campo.opcoes.map((opcao) => (
              <SelectItem key={opcao.valor} value={opcao.valor} className="min-h-11 md:min-h-8">
                {opcao.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
      break

    case "data":
      controle = (
        <Input
          {...comum}
          type="date"
          className={cn(ALTURA_CONTROLE, "w-full sm:w-48")}
          value={typeof valor === "string" ? valor : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        />
      )
      break
  }

  return (
    <div className="space-y-1.5">
      {controle}
      {campo.tipo === "lista-texto" && (
        <p id={`${id}-dica`} className="text-xs text-muted-foreground">
          Um item por linha.
        </p>
      )}
      {mensagemErro && (
        <p id={`${id}-erro`} className="text-xs text-destructive">
          {mensagemErro}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Número e moeda: texto livre, convertido por parsearNumeroBR ao sair do campo
// ---------------------------------------------------------------------------

const FORMATO_MOEDA = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Texto para edição: sem separador de milhar ("1500,5"), para o parse não confundir o ponto. */
function textoEditavel(valor: number | null): string {
  return valor === null ? "" : String(valor).replace(".", ",")
}

/** Texto fora de foco: moeda formatada ("1.500,50"); número igual ao editável. */
function textoExibido(campo: CampoNumero | CampoMoeda, valor: number | null): string {
  if (valor === null) return ""
  return campo.tipo === "moeda" ? FORMATO_MOEDA.format(valor) : textoEditavel(valor)
}

/** Regras de faixa/inteiro da definição; devolve a mensagem de erro ou undefined. */
function validarFaixa(campo: CampoNumero | CampoMoeda, n: number): string | undefined {
  if (campo.tipo === "numero" && campo.inteiro && !Number.isInteger(n)) return "Use um número inteiro."
  if (campo.min !== undefined && n < campo.min) return `O mínimo é ${textoEditavel(campo.min)}.`
  if (campo.max !== undefined && n > campo.max) return `O máximo é ${textoEditavel(campo.max)}.`
  return undefined
}

interface InputNumericoProps {
  id: string
  campo: CampoNumero | CampoMoeda
  valor: number | null
  onChange: (v: ValorCampo) => void
  /** Avisa (em eventos, nunca no render) se o texto digitado é inválido. */
  onInvalido: (invalido: boolean) => void
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

function InputNumerico({ campo, valor, onChange, onInvalido, ...resto }: InputNumericoProps) {
  // Texto em edição (null = não está editando; mostra o valor das props formatado)
  const [texto, setTexto] = React.useState<string | null>(null)
  // Se o valor mudar por fora (descartar, salvar), abandona o texto que sobrou
  const [valorVisto, setValorVisto] = React.useState(valor)
  if (!valoresIguais(valor, valorVisto)) {
    setValorVisto(valor)
    setTexto(null)
  }

  const moeda = campo.tipo === "moeda"
  const unidade = campo.tipo === "numero" ? campo.unidade : undefined

  const confirmar = () => {
    if (texto === null) return
    const numero = parsearNumeroBR(texto)
    if (numero === undefined) {
      // Mantém o texto digitado para a pessoa corrigir
      onInvalido(true)
      return
    }
    onInvalido(false)
    setTexto(null)
    if (numero !== valor) onChange(numero)
  }

  return (
    <div className="relative">
      {moeda && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-sm text-muted-foreground"
        >
          R$
        </span>
      )}
      <Input
        {...resto}
        type="text"
        inputMode={campo.tipo === "numero" && campo.inteiro ? "numeric" : "decimal"}
        autoComplete="off"
        placeholder={campo.placeholder}
        className={cn(ALTURA_CONTROLE, "tabular-nums", moeda && "pl-9", unidade && "pr-14")}
        value={texto ?? textoExibido(campo, valor)}
        onFocus={() => setTexto((atual) => atual ?? textoEditavel(valor))}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmar()
        }}
      />
      {unidade && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-sm text-muted-foreground"
        >
          {unidade}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lista de textos: um item por linha
// ---------------------------------------------------------------------------

/** Linhas aparadas e não vazias. */
function linhasDe(texto: string): string[] {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha) => linha !== "")
}

interface TextareaListaProps {
  id: string
  valor: string[]
  onChange: (v: ValorCampo) => void
  placeholder?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

function TextareaLista({ valor, onChange, ...resto }: TextareaListaProps) {
  // Texto local preserva linhas em branco enquanto se digita (Enter no fim da lista)
  const [texto, setTexto] = React.useState(() => valor.join("\n"))
  // Sincroniza quando a lista muda por fora (descartar, salvar, outro agente)
  if (!valoresIguais(linhasDe(texto), valor)) {
    setTexto(valor.join("\n"))
  }

  return (
    <Textarea
      {...resto}
      className="field-sizing-content min-h-28"
      value={texto}
      onChange={(e) => {
        setTexto(e.target.value)
        onChange(linhasDe(e.target.value))
      }}
    />
  )
}
