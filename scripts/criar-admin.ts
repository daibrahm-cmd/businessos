// scripts/criar-admin.ts
// Cria (ou reaproveita) o usuário admin no Supabase Auth e garante perfis.papel = 'admin'.
// Lê ADMIN_EMAIL e ADMIN_PASSWORD SOMENTE das variáveis de ambiente do processo e nunca imprime a senha.
// Uso: ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD='...' npm run admin:criar
import path from "node:path";
import { pathToFileURL } from "node:url";

export const TAMANHO_MINIMO_SENHA = 12;

/** Cliente mínimo usado pelo script (permite trocar por um falso nos testes). */
export interface ClienteAdmin {
  /** Procura o usuário pelo e-mail; devolve o id ou null. */
  buscarUsuarioPorEmail(email: string): Promise<string | null>;
  /** Cria o usuário com e-mail já confirmado; devolve o id. */
  criarUsuario(email: string, senha: string): Promise<string>;
  /** Grava perfis.papel = 'admin' para o id (cria o perfil se o gatilho ainda não criou). */
  garantirPapelAdmin(id: string, nome: string): Promise<void>;
}

export function validarEmail(email: string | undefined): string {
  const v = (email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new Error("ADMIN_EMAIL ausente ou inválido.");
  return v;
}

export function validarSenha(senha: string | undefined): string {
  if (!senha) throw new Error("ADMIN_PASSWORD ausente.");
  if (senha.length < TAMANHO_MINIMO_SENHA) {
    throw new Error(`ADMIN_PASSWORD precisa ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }
  return senha;
}

export interface ResultadoAdmin {
  id: string;
  criado: boolean;
}

/** Idempotente: se o e-mail já existe só garante o papel; senão cria o usuário e depois o papel. */
export async function criarOuGarantirAdmin(
  cliente: ClienteAdmin,
  email: string,
  senha: string,
): Promise<ResultadoAdmin> {
  let id = await cliente.buscarUsuarioPorEmail(email);
  let criado = false;
  if (!id) {
    id = await cliente.criarUsuario(email, senha);
    criado = true;
  }
  await cliente.garantirPapelAdmin(id, email.split("@")[0]);
  return { id, criado };
}

async function criarClienteReal(): Promise<ClienteAdmin> {
  // Import dinâmico: os testes não precisam das variáveis do Supabase.
  const { criarClienteAdmin } = await import("@/lib/supabase/admin");
  const supabase = criarClienteAdmin();
  return {
    async buscarUsuarioPorEmail(email) {
      // A API não filtra por e-mail: percorre as páginas até achar.
      for (let pagina = 1; pagina <= 50; pagina += 1) {
        const { data, error } = await supabase.auth.admin.listUsers({ page: pagina, perPage: 200 });
        if (error) throw new Error(`Falha ao listar usuários: ${error.message}`);
        const achado = data.users.find((u) => u.email?.toLowerCase() === email);
        if (achado) return achado.id;
        if (data.users.length < 200) return null;
      }
      return null;
    },
    async criarUsuario(email, senha) {
      const { data, error } = await supabase.auth.admin.createUser({ email, password: senha, email_confirm: true });
      if (error || !data.user) throw new Error(`Falha ao criar o usuário: ${error?.message ?? "sem resposta"}`);
      return data.user.id;
    },
    async garantirPapelAdmin(id, nome) {
      // Upsert: funciona tanto se o gatilho já criou o perfil quanto se ainda não.
      const { error } = await supabase.from("perfis").upsert({ id, nome, papel: "admin" }, { onConflict: "id" });
      if (error) throw new Error(`Falha ao gravar o papel admin: ${error.message}`);
    },
  };
}

async function main(): Promise<void> {
  const email = validarEmail(process.env.ADMIN_EMAIL);
  const senha = validarSenha(process.env.ADMIN_PASSWORD);
  const cliente = await criarClienteReal();
  const { id, criado } = await criarOuGarantirAdmin(cliente, email, senha);
  process.stdout.write(`${criado ? "Usuário admin criado" : "Usuário já existia; papel admin garantido"}: ${email}\n`);
  process.stdout.write(`UUID: ${id}\n\n`);
  process.stdout.write("Copie esta linha para o seu .env.local:\n");
  process.stdout.write(`BUSINESSOS_API_USER_ID=${id}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((erro: unknown) => {
    // Só a mensagem: nunca despeja objetos que possam carregar credenciais.
    console.error("Falha ao criar o admin:", erro instanceof Error ? erro.message : "erro desconhecido");
    process.exit(1);
  });
}
