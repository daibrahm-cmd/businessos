import type { Metadata } from "next"

import { FormEntrar } from "@/components/auth/form-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { proximoSeguro } from "@/lib/auth/proximo"

export const metadata: Metadata = { title: "Entrar" }

export default async function PaginaLogin({ searchParams }: { searchParams: Promise<{ proximo?: string; erro?: string }> }) {
  const { proximo, erro } = await searchParams
  const destino = proximoSeguro(proximo)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Entrar</CardTitle>
        <CardDescription>Acesse o contexto do seu negócio.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormEntrar
          proximo={destino === "/" ? undefined : destino}
          avisoInicial={erro === "link" ? "Link inválido ou expirado. Entre ou peça um novo." : undefined}
        />
      </CardContent>
    </Card>
  )
}
