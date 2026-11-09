# BusinessOS

O BusinessOS é um app local para quem está começando um negócio organizar, num só lugar, o contexto que normalmente fica espalhado em cadernos, planilhas e conversas: por que o negócio existe, para quem ele é, o que está sendo testado e como está o caixa. São 12 páginas em 4 seções, cada uma com campos guiados, coleções de itens (lançamentos, clientes, concorrentes etc.) e notas livres em Markdown.

Cada página é gravada como um arquivo `content/<secao>/<pagina>.md` (front matter YAML + notas), legível por pessoas e versionável no git. O mesmo conteúdo que a fundadora edita na interface fica disponível para agentes de IA por uma API local (`/api/context`), para que eles leiam o contexto real do negócio e registrem análises sem sobrescrever o que não enviaram.

## Mapa das páginas

| Seção | Páginas (id) |
|---|---|
| **Founder** | Objetivo (`founder/objetivo`) · Estilo de Vida (`founder/estilo-de-vida`) |
| **Direção** | Mapa de Mercado (`direcao/mapa-de-mercado`) · Imã de Problemas (`direcao/ima-de-problemas`) · Perfil de Cliente Ideal (`direcao/perfil-de-cliente-ideal`) · Tese de Valor (`direcao/tese-de-valor`) · Oferta (`direcao/oferta`) |
| **Validação** | Oferta (`validacao/oferta`) · Leads (`validacao/leads`) · Primeiros Clientes (`validacao/primeiros-clientes`) · Fluxo de Caixa (`validacao/fluxo-de-caixa`) |
| **Caixa** | Fluxo de Caixa (`caixa/fluxo-de-caixa`) · ERP (`caixa/erp`) |

"Oferta" e "Fluxo de Caixa" aparecem em duas seções com papéis diferentes (desenho × teste; orçamento do teste × operação). Use sempre o id.

## Como rodar

Requisitos: Node.js 20+ e npm.

```bash
npm install
npm run content:seed   # cria em content/ os arquivos que faltarem (nunca sobrescreve)
npm run dev            # sobe em 127.0.0.1:3000
```

Abra <http://127.0.0.1:3000>.

Na interface: edite os campos, adicione itens e notas; a barra inferior mostra quantas alterações estão pendentes. Salve com o botão **Salvar** ou `Ctrl+S` / `Cmd+S`. Se um agente alterou a página enquanto você editava, aparece um aviso de conflito com a opção "Salvar mesmo assim" (o que o agente gravou em outros campos é preservado).

Copie `.env.example` para `.env.local` se quiser configurar variáveis (todas opcionais em desenvolvimento).

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
| `npm run content:seed` | Cria os arquivos de conteúdo ausentes a partir dos templates |
| `npm run content:validate` | Valida `content/`, `agents/` e `skills/` (sai com código 1 se algo estiver inválido) |

Antes de considerar uma mudança pronta, todos devem passar: `lint`, `typecheck`, `test`, `content:validate`, `build` e `build-storybook`.

## Storybook

```bash
npm run storybook
```

Os componentes de layout, cards e editor têm stories em `src/components/**/*.stories.tsx`, com alternância entre tema escuro (padrão) e claro. As stories usam dados de exemplo (`src/components/__fixtures__`) e não dependem do servidor.

## Como agentes usam o contexto

O guia completo está em [AGENTS.md](./AGENTS.md): mapa de documentos, como ler, como escrever, regras e códigos de erro. Os agentes prontos ficam em [`agents/`](./agents) (tese-de-valor e analista de caixa) e a skill de acesso em [`skills/contexto-businessos/SKILL.md`](./skills/contexto-businessos/SKILL.md).

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

Se a página mudou depois da leitura, a API responde `409 CONFLITO`: releia e reenvie. Com o app parado, os agentes podem ler e editar direto os arquivos em `content/`.

## Estrutura de pastas

```
BusinessOS/
├── AGENTS.md              guia para agentes (API e regras)
├── agents/                definições de agentes (.md com front matter)
├── skills/                skills reutilizáveis pelos agentes
├── content/               o contexto do negócio: 1 arquivo .md por página
├── docs/                  briefing, PRD e spec técnica
├── scripts/               content:seed e content:validate
├── .storybook/            configuração do Storybook
└── src/
    ├── app/
    │   ├── (app)/         rotas da interface: início, seção e página editável
    │   └── api/context/   API de contexto (GET e PUT)
    ├── components/        layout, cards, editor e componentes shadcn (ui/)
    ├── hooks/             hooks de interface
    └── lib/
        ├── content/       schemas das 12 páginas, repositório em arquivo, merge, serviço, API
        ├── markdown/      renderizador mínimo de Markdown (sem HTML arbitrário)
        └── format.ts      formatação pt-BR (moeda, datas)
```

## Segurança (Fase 1)

**A API não tem autenticação de usuários na Fase 1. Rode o BusinessOS só na sua máquina.**

- `dev` e `start` escutam apenas em `127.0.0.1`; o app não fica exposto na rede local.
- Defina `BUSINESSOS_API_TOKEN` (em `.env.local`) para exigir `Authorization: Bearer <token>` em todas as chamadas da API, GET e PUT.
- Em produção (`NODE_ENV=production`) sem `BUSINESSOS_API_TOKEN`, a API inteira responde `403`.
- A API não emite cabeçalhos CORS, exige `Content-Type: application/json` no PUT, limita o corpo a 256 KiB e valida os ids contra a navegação (sem acesso a caminhos arbitrários).
- Não publique o app em hospedagem antes da Fase 3: o conteúdo inclui dados financeiros e não há login.

## Roadmap

- **Fase 1 (atual):** app local, conteúdo em arquivos `.md`, API de contexto para agentes que a fundadora aciona manualmente.
- **Fase 2:** agentes ativos, que rodam análises e propõem atualizações no contexto de forma recorrente.
- **Fase 3:** armazenamento no Supabase (Postgres + RLS) no lugar dos arquivos e autenticação de usuários, liberando o uso fora da máquina local.

## Documentação

- [docs/01-briefing.md](./docs/01-briefing.md): contexto, problema e público
- [docs/02-prd.md](./docs/02-prd.md): requisitos de produto
- [docs/03-spec.md](./docs/03-spec.md): spec técnica (modelo de conteúdo, API, componentes, testes e plano em ondas)
