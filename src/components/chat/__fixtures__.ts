// Dados de exemplo para as stories do chat.
import type { Conversa, Mensagem, ResumoConversa } from "@/lib/conversas/tipos"

const base = "2026-11-10T12:00:00.000Z"

export const conversasExemplo: ResumoConversa[] = [
  { id: "c1", titulo: "Resumo do meu contexto de negócio", atualizadoEm: "2026-11-10T14:32:00.000Z" },
  { id: "c2", titulo: "Lacunas na tese de valor", atualizadoEm: "2026-11-09T09:10:00.000Z" },
  { id: "c3", titulo: "Qual o próximo passo para validar a oferta?", atualizadoEm: "2026-11-07T18:45:00.000Z" },
  { id: "c4", titulo: "Perfil de cliente ideal para consultorias pequenas e médias de logística", atualizadoEm: "2026-11-02T08:00:00.000Z" },
]

export const mensagensExemplo: Mensagem[] = [
  {
    id: "m1",
    conversaId: "c1",
    papel: "usuario",
    conteudo: "Resuma o meu contexto de negócio em poucos parágrafos.",
    fontes: [],
    criadoEm: base,
  },
  {
    id: "m2",
    conversaId: "c1",
    papel: "assistente",
    conteudo:
      "Hoje o seu negócio está **em fase de direção**: o objetivo está claro, mas a oferta ainda não foi testada.\n\n- **Objetivo:** atingir a primeira receita recorrente em 12 meses.\n- **Cliente ideal:** consultorias pequenas que sofrem com planilhas.\n- **Lacuna:** falta o critério de sucesso do teste de oferta.\n\nPosso sugerir o próximo passo se quiser.",
    fontes: [
      { origemTipo: "documento", origemId: "founder/objetivo", titulo: "Objetivo" },
      { origemTipo: "documento", origemId: "direcao/perfil-de-cliente-ideal", titulo: "Perfil de Cliente Ideal" },
      { origemTipo: "mensagem", origemId: "m0", titulo: "Conversa de 02/11" },
    ],
    criadoEm: base,
  },
]

export const conversaExemplo: Conversa = { ...conversasExemplo[0], mensagens: mensagensExemplo }
