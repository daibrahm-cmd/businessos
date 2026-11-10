# 0001. Banco de dados Supabase em vez de Markdown

- **Status:** aceita
- **Data:** 2026-11-10

## Contexto

Na Fase 1, cada página do BusinessOS é um arquivo `content/<secao>/<pagina>.md` (front matter YAML + notas), e leads e tarefas ficam em `oportunidades/oportunidades.json` e `workflow/tarefas.json`. Isso foi ótimo para começar: zero infraestrutura, diffs legíveis no git, fácil de agentes lerem.

O produto agora precisa de coisas que arquivos locais não entregam bem:

- **Multiusuário:** cada pessoa precisa do próprio conteúdo, isolado do das outras, com login. Arquivos num disco único não têm donos nem permissões.
- **Uso fora da máquina local:** hospedagem serverless (Vercel) tem disco somente leitura; a API sem login só era aceitável rodando em `127.0.0.1`.
- **IA:** a IA (chave `ANTHROPIC_API_KEY`) e os agentes precisam ler e escrever em nome de um usuário, com conflito de escrita tratado de forma confiável (escrita atômica em arquivo não protege entre instâncias).
- **Arquivos anexos:** imagens, PDF, TXT e DOCX não cabem em `.md`; precisam de armazenamento próprio com controle de acesso.
- **Consultas:** filtrar, ordenar e contar (completude, funil, tarefas) sobre muitos arquivos soltos é lento e frágil.

## Decisão

O conteúdo passa a viver no **Supabase** (projeto "BusinessOS", ref `hhqdynsttdhnllmgrddu`, Postgres 17):

- **Postgres com RLS** em todas as tabelas de `public`, com a política "dono vê e edita só o que é seu" (`user_id = auth.uid()`): `perfis`, `documentos`, `oportunidades`, `tarefas` e `arquivos` (metadados).
- **Supabase Auth** para multiusuário. O primeiro usuário é admin e recebe o conteúdo atual (migração); novos usuários começam com cards vazios, que preenchem à mão ou pedem para a IA. Documento ausente = template vazio, então não é preciso seed por usuário.
- **Supabase Storage**, bucket privado `arquivos`, caminho `<user_id>/...`, com limite de tamanho, tipos permitidos (`image/*`, PDF, TXT, DOCX) e policies por pasta do dono. Ainda sem botão de upload na interface.
- **Título, descrição e estágio** das páginas continuam derivados do código (navegação e schemas); o banco guarda só o que o usuário escreve.
- **`BUSINESSOS_STORAGE=fs|supabase`** continua como chave de troca; o padrão passa a ser `supabase`.
- **API de agentes** (`/api/context`, Bearer `BUSINESSOS_API_TOKEN`) atua como o usuário `BUSINESSOS_API_USER_ID`, via cliente admin (service role) no servidor.
- Os arquivos `.md` continuam úteis só como **exportação/backup** (`exportar-md.ts`) e como **fonte do seed/migração inicial**.

## Alternativas consideradas

1. **Manter Markdown + sistema de arquivos.** Prós: simples, versionável em git, portável. Contras: sem usuários, sem permissões, não roda em serverless, sem lugar para anexos, conflito só resolvido por convenção.
2. **SQLite local.** Prós: consultas e transações reais sem servidor. Contras: continua preso a uma máquina (sem multiusuário nem hospedagem serverless) e exigiria construir auth, permissões e storage de arquivos por conta própria.
3. **Supabase (escolhida).** Prós: Postgres + Auth + Storage + RLS prontos, um SDK, plano gratuito para começar. Contras: dependência de um fornecedor, mais variáveis de ambiente e segredos, e a segurança passa a depender de políticas RLS bem escritas.

## Consequências

**Positivas**

- Multiusuário real, com isolamento por dono garantido no banco, não só no código.
- Pode ser publicado (hospedagem serverless) depois de revisar os riscos abaixo.
- Anexos, IA e agentes ganham um lugar seguro e consultável para ler e escrever.
- A troca é localizada: UI, Server Actions e schemas não mudam, pois dependem só de `ContentDoc` e da interface `ContentRepository`.

**Negativas**

- Novas dependências (`@supabase/ssr`, `@supabase/supabase-js`) e variáveis de ambiente.
- Perde-se o "git como rede de segurança" do conteúdo; o backup passa a ser a exportação `.md` e os backups do Supabase.
- Testes precisam de fakes ou de um banco de teste, em vez de um diretório temporário.
- Dados pessoais de leads passam a ficar em servidor de terceiro (ver `../04-lgpd-prospeccao.md`).

**Riscos**

- **RLS:** tabela criada sem RLS, ou política errada, expõe dados de todos os usuários. Mitigação: RLS ligada em toda tabela de `public`, política única e simples por `user_id`, revisão com os advisors de segurança do Supabase a cada migração.
- **Service role:** a chave `SUPABASE_SERVICE_ROLE_KEY` ignora RLS. Mitigação: só em servidor e scripts, nunca com prefixo `NEXT_PUBLIC_`, nunca no repositório; o cliente admin sempre filtra por `BUSINESSOS_API_USER_ID`.
- **Migração:** importar o conteúdo atual para o admin pode duplicar ou corromper dados. Mitigação: script idempotente com `--dry-run` e os `.md` originais mantidos como fonte.
- **Região:** o projeto está em `us-east-1` (EUA), o que é transferência internacional de dados pessoais; registrado como ponto de atenção LGPD.

## Plano de migração

1. Criar o schema (tabelas, RLS, trigger de `perfis`) e o bucket `arquivos` com suas policies, por migrations versionadas em `supabase/`.
2. Implementar `SupabaseContentRepository` e os repositórios de oportunidades e tarefas atrás das interfaces atuais, escolhidos por `BUSINESSOS_STORAGE`.
3. Criar o admin: `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:criar` (credenciais só na linha de comando; anotar o id em `BUSINESSOS_API_USER_ID`).
4. Importar o conteúdo atual para o admin: `npm run db:migrar-conteudo -- --dry-run` e, se estiver certo, sem `--dry-run`. É idempotente.
5. Trocar o padrão para `BUSINESSOS_STORAGE=supabase`, validar a interface e a API de agentes, e só então publicar.
6. Manter `content/`, `oportunidades/` e `workflow/` no repositório por um tempo como backup; depois, apenas a exportação `.md`.

## Links

- Spec técnica, seção 11: [../03-spec.md](../03-spec.md)
- PRD, seção 4.8 e riscos: [../02-prd.md](../02-prd.md)
- LGPD e prospecção: [../04-lgpd-prospeccao.md](../04-lgpd-prospeccao.md)
- Guia de agentes: [../../AGENTS.md](../../AGENTS.md)
- Supabase: Row Level Security e Storage em <https://supabase.com/docs>
