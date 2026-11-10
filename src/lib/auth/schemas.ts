// src/lib/auth/schemas.ts
// Validação dos formulários de autenticação (zod). Mensagens em português.
import { z } from "zod";

const email = z
  .string({ error: "Informe seu e-mail." })
  .trim()
  .toLowerCase()
  .min(1, "Informe seu e-mail.")
  .max(254, "E-mail longo demais.")
  .pipe(z.email("Informe um e-mail válido."));

export const entrarSchema = z.object({
  email,
  senha: z.string({ error: "Informe sua senha." }).min(1, "Informe sua senha.").max(200),
});

export const cadastrarSchema = z
  .object({
    nome: z.string().trim().max(80, "Nome longo demais.").optional(),
    email,
    senha: z
      .string({ error: "Crie uma senha." })
      .min(8, "A senha precisa ter pelo menos 8 caracteres.")
      .max(200, "Senha longa demais."),
    confirmar: z.string({ error: "Repita a senha." }),
  })
  .refine((d) => d.senha === d.confirmar, { path: ["confirmar"], message: "As senhas não conferem." });

export type EntrarEntrada = z.infer<typeof entrarSchema>;
export type CadastrarEntrada = z.infer<typeof cadastrarSchema>;

/** Estado devolvido pelas Server Actions para o formulário. */
export interface EstadoAuth {
  erro?: string;
  /** Mensagem de sucesso neutra (ex.: "confirme seu e-mail"). */
  aviso?: string;
  /** Erros por campo. */
  campos?: Partial<Record<"nome" | "email" | "senha" | "confirmar", string>>;
  /** Valores para repreencher (nunca a senha). */
  valores?: { nome?: string; email?: string };
}

/** Converte issues do zod em um erro por campo (primeiro de cada). */
export function errosPorCampo(erro: z.ZodError): NonNullable<EstadoAuth["campos"]> {
  const saida: Record<string, string> = {};
  for (const issue of erro.issues) {
    const chave = String(issue.path[0] ?? "");
    if (chave && !saida[chave]) saida[chave] = issue.message;
  }
  return saida;
}
