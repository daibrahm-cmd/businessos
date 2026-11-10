import type { Metadata } from "next"

import { FormCadastrar } from "@/components/auth/form-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Criar conta" }

export default function PaginaCadastro() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Criar conta</CardTitle>
        <CardDescription>Use seu e-mail e uma senha com 8 caracteres ou mais.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormCadastrar />
      </CardContent>
    </Card>
  )
}
