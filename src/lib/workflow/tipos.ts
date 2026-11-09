// src/lib/workflow/tipos.ts
// Tarefas do quadro Workflow: o que cada agente está fazendo, em qual coluna e em quais documentos.
import { z } from "zod";
import { RE_NOME_AGENTE } from "@/lib/content/agentes";
import { docIdSchema } from "@/lib/content/schemas/base";

/** Colunas do Kanban, na ordem do fluxo. */
export const STATUS_TAREFA = ["fila", "trabalhando", "revisao", "concluida"] as const;
export const statusTarefaSchema = z.enum(STATUS_TAREFA);
export type StatusTarefa = z.infer<typeof statusTarefaSchema>;

export const ROTULOS_STATUS_TAREFA: Record<StatusTarefa, string> = {
  fila: "Na fila",
  trabalhando: "Trabalhando",
  revisao: "Em revisão",
  concluida: "Concluído",
};

export const RE_ID_TAREFA = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;

/** Tarefa gravada em workflow/tarefas.json. */
export const tarefaSchema = z.strictObject({
  id: z.string().regex(RE_ID_TAREFA),
  agente: z.string().regex(RE_NOME_AGENTE), // nome do arquivo em agents/<nome>.md
  titulo: z.string().trim().min(1).max(120),
  status: statusTarefaSchema,
  docs: z.array(docIdSchema).max(12).default([]), // documentos em que o agente trabalha
  nota: z.string().trim().max(300).optional(),
  criado_em: z.iso.datetime(),
  atualizado_em: z.iso.datetime(),
});
export type Tarefa = z.infer<typeof tarefaSchema>;

/** Corpo aceito no POST /api/workflow: cria (sem id) ou atualiza (com id) uma tarefa. */
export const entradaTarefaSchema = z.strictObject({
  id: z.string().regex(RE_ID_TAREFA).optional(),
  agente: z.string().regex(RE_NOME_AGENTE),
  titulo: z.string().trim().min(1).max(120).optional(),
  status: statusTarefaSchema.optional(),
  docs: z.array(docIdSchema).max(12).optional(),
  nota: z.string().trim().max(300).nullable().optional(), // null limpa a nota
});
export type EntradaTarefa = z.infer<typeof entradaTarefaSchema>;

export const arquivoTarefasSchema = z.strictObject({ tarefas: z.array(tarefaSchema) });
