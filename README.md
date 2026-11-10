# BusinessOS

O BusinessOS é um app web para quem está começando um negócio organizar, num só lugar, o contexto que normalmente fica espalhado em cadernos, planilhas e conversas: por que o negócio existe, para quem ele é, o que está sendo testado e como está o caixa. São 12 páginas em 4 seções, cada uma com campos guiados, coleções de itens (lançamentos, clientes, concorrentes etc.) e notas livres em Markdown.

O conteúdo fica no **Supabase** (Postgres com RLS, Auth e Storage): cada usuário tem o seu, isolado por `user_id = auth.uid()`. Quem se cadastra começa com cards vazios, que preenche à mão ou pede para a IA. O mesmo conteúdo que a pessoa edita na interface fica disponível para agentes de IA pela API (`/api/context`, com token), para que eles leiam o contexto real do negócio e registrem análises sem sobrescrever o que não enviaram. Os arquivos `.md` servem só como exportação/backup e como fonte da migração inicial. A decisão está em [docs/decisions/0001](./docs/decisions/0001-banco-de-dados-supabase-em-vez-de-markdown.md).

## Mapa das páginas

| Seção | Páginas (id) |
|---|---|
| **Founder** | Objetivo (`founder/objetivo`) · Estilo de Vida (`founder/estilo-de-vida`) |
| **Direção** | Mapa de Mercado (`direcao/mapa-de-mercado`) · Imã de Problemas (`direcao/ima-de-problemas`) · Perfil de Cliente Ideal (`direcao/perfil-de-cliente-ideal`) · Tese de Valor (`direcao/tese-de-valor`) · Oferta (`direcao/oferta`) |
| **Validação** | Oferta (`validacao/oferta`) · Leads (`validacao/leads`) · Primeiros Clientes (`validacao/primeiros-clientes`) · Fluxo de Caixa (`validacao/fluxo-de-caixa`) |
| **Caixa** | Fluxo de Caixa (`caixa/fluxo-de-caixa`) · ERP (`caixa/erp`) |

"Oferta" e "Fluxo de Caixa" aparecem em duas seções com papéis diferentes (desenho × teste; orçamento do teste × operação). Use sempre o id.

## Como rodar

Requisitos: Node.js 20+, npm e acesso ao projeto Supabase "BusinessOS" (ref `hhqdynsttdhnllmgrddu`, Postgres 17).

```bash
npm install
cp .env.example .env.local   # preencha as variáveis do Supabase (veja abaixo)

# Uma vez: cria o admin (credenciais só na linha de comando, nunca em arquivo)
ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD='sua-senha' npm run admin:criar
# Copie o id do admin para BUSINESSOS_API_USER_ID no .env.local

# Uma vez: importa o conteúdo atual (content/, oportunidades/, workflow/) para o admin
npm run db:migrar-conteudo -- --dry-run   # confere sem gravar
npm run db:migrar-conteudo                # grava (idempotente)

npm run dev            # sobe em 127.0.0.1:3000
```

Abra <http://127.0.0.1:3000> e entre com o login. O primeiro usuário é admin; quem se cadastra depois começa com cards vazios.

Sem Supabase (só para desenvolvimento ou testes), `BUSINESSOS_STORAGE=fs` volta a usar os arquivos de `content/`. O padrão é `supabase`.

Na interface: edite os campos, adicione itens e notas; a barra inferior mostra quantas alterações estão pendentes. Salve com o botão **Salvar** ou `Ctrl+S` / `Cmd+S`. Se um agente alterou a página enquanto você editava, aparece um aviso de conflito com a opção "Salvar mesmo assim" (o que o agente gravou em outros campos é preservado).

### Variáveis de ambiente

Todas as de IA e a service role valem só no servidor. Para ligar a IA: coloque `ANTHROPIC_API_KEY` no `.env.local` e reinicie o app. A IA passa por um contrato único `ProvedorIA` (`src/lib/ia/provedor.ts`) com dois modos: `api` (`src/lib/ia/claude-api.ts`, `fetch` direto, sem SDK) e `cli` (`claude -p`, comportamento anterior).

| Variável | Para que serve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Conexão do navegador e do servidor com o Supabase (podem ser públicas) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta, **só servidor e scripts**; ignora RLS. Nunca com prefixo `NEXT_PUBLIC_` |
| `BUSINESSOS_STORAGE` | `supabase` (padrão) ou `fs` |
| `BUSINESSOS_API_TOKEN` | Token Bearer da API de agentes (`/api/context`, `/api/workflow`) |
| `BUSINESSOS_API_USER_ID` | Usuário em nome do qual a API de agentes lê e escreve |
| `ANTHROPIC_API_KEY` | Chave da IA ("Pedir à IA", briefing, relatório). Se definida, o modo padrão da IA vira `api`; sem ela, usa `cli` |
| `BUSINESSOS_IA` | `api` \| `cli` \| `desligada`. Vence a regra do padrão acima |
| `BUSINESSOS_IA_MODELO` | Modelo usado no modo `api` (padrão `claude-sonnet-5-5`) |
| `BUSINESSOS_IA_MAX_TOKENS` | Limite de tokens da resposta (padrão `8192`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Só para `npm run admin:criar`, passados na linha de comando |

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em `127.0.0.1:3000` |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção em `127.0.0.1` |
| `npm run lint` | ESLint em todo o projeto |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `npm test` | Testes unitários e de integração (Vitest) |
| `npm run test:watch` | Testes em modo observação |
| `npm run storybook` | Storybook em <http://localhost:6006> |
| `npm run build-storybook` | Build estático do Storybook (`storybook-static/`) |
| `npm run admin:criar` | Cria o usuário admin no Supabase (`ADMIN_EMAIL` e `ADMIN_PASSWORD` na linha de comando) |
| `npm run db:migrar-conteudo` | Importa o conteúdo atual (`content/*.md`, oportunidades e tarefas) para o admin; idempotente; aceita `--dry-run` |
| `npm run content:seed` | Cria os arquivos de `content/` ausentes a partir dos templates (só modo `fs` e fonte da migração) |
| `npm run content:validate` | Valida `content/`, `agents/` e `skills/` (sai com código 1 se algo estiver inválido) |

Antes de considerar uma mudança pronta, todos devem passar: `lint`, `typecheck`, `test`, `content:validate`, `build` e `build-storybook`.

## Storybook

```bash
npm run storybook
```

Os componentes de layout, cards e editor têm stories em `src/components/**/*.stories.tsx`, com alternância entre tema escuro (padrão) e claro. As stories usam dados de exemplo (`src/components/__fixtures__`) e não dependem do servidor.

## Como agentes usam o contexto

O guia completo está em [AGENTS.md](./AGENTS.md): mapa de documentos, como ler, como escrever, regras e códigos de erro. Os agentes prontos ficam em [`agents/`](./agents) (definições em arquivo) e a skill de acesso em [`skills/contexto-businessos/SKILL.md`](./skills/contexto-businessos/SKILL.md).

Ler todo o contexto em Markdown, pronto para um prompt:

```bash
curl -s "http://127.0.0.1:3000/api/context?format=md"
```

Ler uma página em JSON (`documento` + `definicao` com os campos e opções):

```bash
curl -s http://127.0.0.1:3000/api/context/direcao/tese-de-valor
```

Escrever (merge parcial: o que não for enviado fica como está):

```bash
curl -X PUT http://127.0.0.1:3000/api/context/direcao/tese-de-valor \
  -H "Content-Type: application/json" \
  -d '{
    "atualizado_por": "agente:tese-de-valor",
    "esperado_atualizado_em": "<documento.atualizado_em lido no GET>",
    "campos": { "resultado_prometido": "Saber o lucro do mês em 5 minutos" },
    "corpo_anexar": "## Sugestão do tese-de-valor (08/11)\n- Testar a promessa ligada ao DAS."
  }'
```

Se a página mudou depois da leitura, a API responde `409 CONFLITO`: releia e reenvie. A API atua como o usuário `BUSINESSOS_API_USER_ID` (cliente admin no servidor). Não edite `content/*.md` esperando que o app reflita: o conteúdo vivo está no banco.

## Estrutura de pastas

```
BusinessOS/
├── AGENTS.md              guia para agentes (API e regras)
├── agents/                definições de agentes (.md com front matter)
├── skills/                skills reutilizáveis pelos agentes
├── content/               conteúdo inicial em .md (fonte do seed/migração e backup; o conteúdo vivo está no Supabase)
├── docs/                  briefing, PRD, spec, LGPD e decisions/ (ADRs)
├── supabase/              migrations SQL (tabelas, RLS, Storage)
├── scripts/               admin:criar, db:migrar-conteudo, content:seed e content:validate
├── .storybook/            configuração do Storybook
└── src/
    ├── app/
    │   ├── (app)/         rotas da interface: início, seção e página editável
    │   └── api/context/   API de contexto (GET e PUT)
    ├── components/        layout, cards, editor e componentes shadcn (ui/)
    ├── hooks/             hooks de interface
    └── lib/
        ├── content/       schemas das páginas, repositórios (Supabase e arquivo), merge, serviço, API
        ├── supabase/      clientes (env, browser, server, admin) e usuário atual
        ├── markdown/      renderizador mínimo de Markdown (sem HTML arbitrário)
        └── format.ts      formatação pt-BR (moeda, datas)
```

## Segurança

- **Login obrigatório.** O acesso é por Supabase Auth; cada usuário só enxerga o que é seu (RLS em todas as tabelas de `public`, política `user_id = auth.uid()`).
- **Service role só no servidor.** `SUPABASE_SERVICE_ROLE_KEY` ignora RLS: nunca use prefixo `NEXT_PUBLIC_`, nunca commite, nunca a envie ao navegador. Credenciais do admin vão só na linha de comando.
- **API de agentes.** Defina `BUSINESSOS_API_TOKEN` para exigir `Authorization: Bearer <token>` em todas as chamadas (GET e PUT); a API atua como o usuário `BUSINESSOS_API_USER_ID`. Em produção (`NODE_ENV=production`) sem token, a API inteira responde `403`.
- A API não emite cabeçalhos CORS, exige `Content-Type: application/json` no PUT, limita o corpo a 256 KiB e valida os ids contra a navegação.
- **Arquivos.** O bucket `arquivos` é privado, com caminho `<user_id>/...`, limite de tamanho e tipos permitidos (imagens, PDF, TXT, DOCX).
- **LGPD.** Dados pessoais de leads ficam no Supabase (região `us-east-1`, EUA): veja [docs/04-lgpd-prospeccao.md](./docs/04-lgpd-prospeccao.md).
- `dev` e `start` continuam escutando em `127.0.0.1`.

## Roadmap

- **Fase 1 (entregue):** app local, conteúdo em arquivos `.md`, API de contexto para agentes.
- **Fase 3 (em andamento, antecipada):** Supabase (Postgres + RLS, Auth, Storage) no lugar dos arquivos, multiusuário. Veja o [ADR 0001](./docs/decisions/0001-banco-de-dados-supabase-em-vez-de-markdown.md).
- **IA:** interface e provedor prontos (modos `api` e `cli`); para usar a API basta colocar `ANTHROPIC_API_KEY`.
- **Fase 2:** agentes ativos, que rodam análises e propõem atualizações no contexto de forma recorrente.
- **Depois:** botão de upload de arquivos na interface, histórico de versões e permissões por agente.

## Documentação

- [docs/01-briefing.md](./docs/01-briefing.md): contexto, problema e público
- [docs/02-prd.md](./docs/02-prd.md): requisitos de produto
- [docs/03-spec.md](./docs/03-spec.md): spec técnica (modelo de conteúdo, API, componentes, testes e plano em ondas)
- [docs/04-lgpd-prospeccao.md](./docs/04-lgpd-prospeccao.md): LGPD e prospecção (rascunho para revisão jurídica)
- [docs/decisions/](./docs/decisions/README.md): decisões de arquitetura (ADRs)
