"use server"
// Ações de item da página Leads. Hoje: criar uma oportunidade (Kanban de vendas) a partir de um lead.
// Lê o lead no servidor pelo id (não confia em dados vindos do navegador) e nunca lança para a UI.
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { lerDocumento } from "@/lib/content/servico"
import { lerOportunidades, salvarOportunidade } from "@/lib/oportunidades/repositorio"

export type ResultadoAcaoItem = { ok: boolean; mensagem: string; href?: string }

const SEM_DADO = "a confirmar"

/** Texto do campo ou undefined quando está vazio ou diz "A confirmar". */
function dado(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined
  const t = valor.trim()
  return t && t.toLowerCase() !== SEM_DADO ? t : undefined
}

export async function criarOportunidadeDoLeadAction(itemId: unknown): Promise<ResultadoAcaoItem> {
  const id = z.string().min(1).max(64).safeParse(itemId)
  if (!id.success) return { ok: false, mensagem: "Lead inválido." }
  try {
    const lead = (await lerDocumento("validacao/leads")).itens.find((i) => i.id === id.data)
    if (!lead) return { ok: false, mensagem: "Lead não encontrado." }

    const empresa = dado(lead.empresa) ?? ""
    const contato = dado(lead.contato_nome)
    const nome = contato ?? "Contato a confirmar"

    // Já existe oportunidade para este lead (mesmo contato e empresa)?
    const mesmo = (a?: string, b?: string) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase()
    const existente = (await lerOportunidades()).find((o) => mesmo(o.lead, nome) && mesmo(o.empresa, empresa))
    if (existente) return { ok: false, mensagem: "Este lead já está em Oportunidades.", href: "/oportunidades" }

    // Melhor meio de contato disponível: e-mail (sem a observação entre parênteses) ou LinkedIn
    const email = dado(lead.contato_email)?.replace(/\s*\(.*\)\s*$/, "")
    const meioDeContato = email ?? dado(lead.contato_linkedin)

    await salvarOportunidade({
      lead: nome,
      empresa: empresa || undefined,
      titulo: empresa ? `Primeira conversa · ${empresa}` : "Primeira conversa",
      estagio: "novo",
      contato: meioDeContato,
      proximo_passo: contato ? "Enviar a primeira mensagem" : "Descobrir quem decide e o contato dele",
    })
    revalidatePath("/oportunidades")
    return { ok: true, mensagem: "Oportunidade criada em Novo lead.", href: "/oportunidades" }
  } catch (erro) {
    console.error("[leads] criar oportunidade", erro)
    return { ok: false, mensagem: "Não foi possível criar a oportunidade. Tente de novo." }
  }
}
