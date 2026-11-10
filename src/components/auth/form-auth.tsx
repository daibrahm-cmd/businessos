"use client"

// Formulários de login e cadastro (cliente, para exibir erros/pendência via useActionState).
import Link from "next/link"
import { useActionState } from "react"

import { cadastrar, entrar } from "@/app/(auth)/acoes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EstadoAuth } from "@/lib/auth/schemas"

const ESTADO_INICIAL: EstadoAuth = {}

function Campo({
  id,
  rotulo,
  erro,
  ...props
}: { id: string; rotulo: string; erro?: string } & React.ComponentProps<"input">) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        name={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        // 44 px de altura no toque; compacto no desktop
        className="h-11 md:h-9"
        {...props}
      />
      {erro && (
        <p id={`${id}-erro`} className="text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  )
}

function Mensagem({ estado }: { estado: EstadoAuth }) {
  if (estado.erro)
    return (
      <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {estado.erro}
      </p>
    )
  if (estado.aviso)
    return (
      <p role="status" className="rounded-lg bg-muted px-3 py-2 text-sm">
        {estado.aviso}
      </p>
    )
  return null
}

export function FormEntrar({ proximo, avisoInicial }: { proximo?: string; avisoInicial?: string }) {
  const [estado, acao, pendente] = useActionState(entrar, ESTADO_INICIAL)
  const exibido = estado.erro || estado.campos ? estado : { ...estado, erro: avisoInicial }
  return (
    <form action={acao} className="grid gap-4" noValidate>
      {proximo && <input type="hidden" name="proximo" value={proximo} />}
      <Mensagem estado={exibido} />
      <Campo id="email" rotulo="E-mail" type="email" autoComplete="email" defaultValue={estado.valores?.email} erro={estado.campos?.email} required />
      <Campo id="senha" rotulo="Senha" type="password" autoComplete="current-password" erro={estado.campos?.senha} required />
      <Button type="submit" size="lg" className="h-11 md:h-9" disabled={pendente}>
        {pendente ? "Entrando..." : "Entrar"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-foreground underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </form>
  )
}

export function FormCadastrar() {
  const [estado, acao, pendente] = useActionState(cadastrar, ESTADO_INICIAL)
  return (
    <form action={acao} className="grid gap-4" noValidate>
      <Mensagem estado={estado} />
      <Campo id="nome" rotulo="Nome (opcional)" autoComplete="name" defaultValue={estado.valores?.nome} erro={estado.campos?.nome} />
      <Campo id="email" rotulo="E-mail" type="email" autoComplete="email" defaultValue={estado.valores?.email} erro={estado.campos?.email} required />
      <Campo id="senha" rotulo="Senha (mínimo 8 caracteres)" type="password" autoComplete="new-password" erro={estado.campos?.senha} required />
      <Campo id="confirmar" rotulo="Repita a senha" type="password" autoComplete="new-password" erro={estado.campos?.confirmar} required />
      <Button type="submit" size="lg" className="h-11 md:h-9" disabled={pendente}>
        {pendente ? "Criando..." : "Criar conta"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  )
}
