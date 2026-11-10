# BusinessOS — PRD (Documento de Requisitos de Produto)

Versão: 0.3 · Data: 2026-11-10 · Estágio do negócio: "Para quem está começando" (selo na interface: "Sistema de marca viva")
Documentos relacionados: `01-briefing.md` (contexto), `03-spec.md` (schemas, contratos técnicos), `04-lgpd-prospeccao.md` (LGPD), `decisions/` (ADRs).
Atualização 2026-11-10: armazenamento migrado de Markdown para Supabase (ADR 0001); seções de persistência, segurança e riscos reescritas.

| Versão | Data | O que mudou |
|--------|------|-------------|
| 0.1 | 2026-11-08 | Versão inicial (12 páginas, Fase 1 só com arquivos e API). |
| 0.2 | 2026-11-09 | 13 páginas (entra Leads); relatório de leitura com gaveta de edição e personas de cliente; passo a passo, briefing, oportunidades, workflow e agentes na interface; design real (IBM Plex Mono, Carvão e Verde). Itens da Fase 2 já entregues em parte. |
| 0.3 | 2026-11-10 | Armazenamento migrado de Markdown para Supabase (Postgres + RLS, Auth, Storage), multiusuário, segurança e LGPD revisadas, IA via provedor (API ou CLI). |

---

## 1. Visão geral e objetivos

### 1.1 Visão

BusinessOS é a **inteligência do negócio** da fundadora: um sistema de tomada de decisão. Ela registra o que sabe (e o que decide) sobre o negócio em páginas com campos, e **agentes de IA e skills leem e escrevem o mesmo conteúdo**. O conteúdo fica no Supabase (Postgres com RLS), isolado por usuário, e é exportável em Markdown com front matter YAML, usável diretamente como contexto de IA.

### 1.2 Problema

Quem está começando um negócio guarda decisões espalhadas (notas, conversas com IA, planilhas). Cada conversa com IA recomeça do zero, sem contexto, e as decisões não ficam registradas de forma consultável.

### 1.3 Objetivos mensuráveis

| # | Objetivo | Métrica | Meta (Fase 1) |
|---|----------|---------|---------------|
| O1 | Concentrar o contexto do negócio em um só lugar | Páginas com status diferente de `vazio` | 13 de 13 em até 30 dias do primeiro uso |
| O2 | Tornar o contexto utilizável por IA sem retrabalho | Tempo para entregar o contexto completo a um agente (`GET /api/context?format=md`) | < 1 clique/comando e resposta < 500 ms |
| O3 | Reduzir atrito de edição | Tempo para editar e salvar um campo | < 10 s, sem recarregar a página |
| O4 | Dar clareza de maturidade das decisões | Páginas com status `validado` | >= 4 de 13 em até 60 dias |
| O5 | Garantir portabilidade | Documentos legíveis e editáveis fora do app | 100% dos docs exportam para `.md` válido com front matter |
| O6 | Experiência mobile | Fluxo "abrir página, editar, salvar" funcional em 375 px | 100% das páginas |

---

## 2. Personas

Estas são as personas **do produto** (quem usa o BusinessOS). Não confundir com as **personas de cliente** da fundadora, que são conteúdo da página `direcao/perfil-de-cliente-ideal` (ver 4.3 e 5.2).

### 2.1 Fundador(a)
- Está começando o negócio; toma decisões sozinha e precisa de clareza, não de burocracia.
- Usa o app no desktop e no celular.
- Quer escrever rápido, ver o que falta e entregar contexto a seus agentes sem copiar e colar manualmente.
- **Dor:** decisões dispersas; IA sem memória do negócio.

### 2.2 Agente de IA (usuário de primeira classe)
- Lê e escreve o contexto **por API** (`/api/context`, Bearer token, em nome do usuário `BUSINESSOS_API_USER_ID`); as definições de agentes e skills continuam em arquivos (`AGENTS.md`, `agents/`, `skills/`).
- Precisa de contrato estável: front matter previsível, ids de documento, regras claras de escrita.
- Deve se identificar (`atualizado_por: agente:<nome>`) e **não apagar campos preenchidos por humano**.
- **Dor:** contexto ambíguo, schema implícito, risco de sobrescrever o trabalho da fundadora.

---

## 3. Escopo: MVP e fases

| Fase | Foco | Entrega principal |
|------|------|-------------------|
| **1 — MVP** | UI + arquivos MD (hoje migrado para o Supabase, ver Fase 3) | App Next.js com 13 páginas, home, índices de seção, relatório de leitura com edição em modal e gaveta, salvar o documento (na Fase 1 em `content/*.md`; hoje no Supabase), status do documento, tema escuro/claro, API de contexto local, `AGENTS.md` + `agents/` + `skills/` como arquivos. **Entregue**, junto com passo a passo, briefing, oportunidades, workflow e lista de agentes (ver 4.9 a 4.13) |
| **2 — Agentes e skills ativos** | Agentes trabalham junto | **Parcial:** a UI lista agentes e mostra o que cada um faz (Workflow e Agentes), e a IA (API da Anthropic ou CLI local) gera o briefing e sugere campos. **Falta:** executar qualquer agente sobre documentos pela UI e revisão de sugestões (aceitar/rejeitar) |
| **3 — Persistência e multiusuário** | Supabase | **Em andamento (antecipada):** `SupabaseContentRepository`, Supabase Auth (multiusuário; o 1º usuário é admin e recebe o conteúdo atual), tabelas com RLS por dono, bucket privado `arquivos`, scripts `admin:criar` e `db:migrar-conteudo`. **Depois:** botão de upload na UI, histórico de versões, permissões por agente |

**Fora do escopo (continua):** histórico de versões, equipes e compartilhamento entre usuários, colaboração em tempo real, integrações externas, notificações. A execução de agentes pela UI ainda é só parcial (briefing e "Pedir à IA", via provedor de IA: API da Anthropic ou CLI local).

**Decisão de arquitetura tomada:** acesso a dados via interface `ContentRepository`, com implementação Supabase (padrão) e em arquivos (`BUSINESSOS_STORAGE=fs`). Banco em vez de Markdown: [ADR 0001](./decisions/0001-banco-de-dados-supabase-em-vez-de-markdown.md). Trade-off: dependência de um fornecedor e de políticas RLS corretas, em troca de multiusuário, anexos e uso fora da máquina local.

---

## 4. Requisitos funcionais

Prioridade: **P0** = MVP obrigatório; **P1** = desejável no MVP; **F2/F3** = fases seguintes.

### 4.1 Navegação

| ID | Requisito | Prio |
|----|-----------|------|
| RF-01 | Sidebar com selo do estágio ("Sistema de marca viva") e três grupos: GERAL (Início, Passo a passo, Oportunidades, Briefing); as 4 seções (FOUNDER, DIREÇÃO, VALIDAÇÃO, CAIXA) com as 13 páginas definidas na navegação; e SISTEMA (Workflow, Agentes). | P0 |
| RF-02 | Itens da sidebar têm destaque de fundo no hover e destaque do item ativo. | P0 |
| RF-03 | No mobile, a sidebar vira painel deslizante (sheet) aberto por botão no cabeçalho. | P0 |
| RF-04 | Cada item do menu abre uma página própria, com URL `/<secao>/<pagina>`. "Oferta" e "Fluxo de Caixa" existem em duas seções como páginas **distintas** (ids `direcao/oferta` e `validacao/oferta`; `validacao/fluxo-de-caixa` e `caixa/fluxo-de-caixa`). | P0 |
| RF-05 | A navegação vem de uma única fonte (`navigation.ts`); adicionar página não exige alterar vários arquivos. | P0 |

### 4.2 Home e índice de seção

| ID | Requisito | Prio |
|----|-----------|------|
| RF-06 | A home (`/`) mostra visão geral em cards: uma por seção, com progresso (páginas por status) e acesso às páginas. | P0 |
| RF-07 | Progresso por seção = quantidade de páginas por status (vazio, rascunho, em validação, validado) e percentual de páginas não vazias. | P0 |
| RF-08 | A home destaca "próximas páginas a preencher" (primeira página `vazio` ou `rascunho` por seção). | P1 |
| RF-09 | O índice de seção (`/<secao>`) lista as páginas da seção como cards com título, descrição, status e data de atualização. | P0 |

### 4.3 Página editável

| ID | Requisito | Prio |
|----|-----------|------|
| RF-10 | Cada página abre em **relatório de leitura**: título, indicador de completude, campos em cards agrupados e notas. O botão Editar abre a edição de todos os campos em um modal, com rótulo, ajuda e área de escrita. | P0 |
| RF-11 | Páginas com coleções (`itens`) renderizam cada item como card; é possível adicionar, editar e remover itens. No relatório, coleções de lista mostram um card por linha, e clicar abre uma **gaveta lateral** com todos os campos do item e edição na hora (salva só o item alterado). | P0 |
| RF-11a | A coleção `personas` de `direcao/perfil-de-cliente-ideal` usa o card de persona: número grande, nome, frase de destaque, perfil, momento e gatilhos em chips (3 visíveis, o resto vira "+N"). Cada persona tem nome, frase, perfil, psicografia, momento, contexto e gatilhos. | P0 |
| RF-12 | Toda página tem uma área de **notas livres** em Markdown (campo `corpo` do documento), editável. | P0 |
| RF-13 | Botão **Salvar** persiste campos, itens, notas e status do documento (linha em `documentos`, chave `user_id` + `id`), sem recarregar a página; mostra confirmação ou erro. | P0 |
| RF-14 | Ao salvar, o sistema atualiza `atualizado_em` e define `atualizado_por: humano`. | P0 |
| RF-15 | Alterações não salvas são sinalizadas; sair da página com alterações pendentes pede confirmação. | P1 |
| RF-16 | Se o documento mudou no banco desde a abertura (ex.: um agente escreveu), o salvamento avisa do conflito e não sobrescreve silenciosamente. | P1 |

### 4.4 Status do documento

| ID | Requisito | Prio |
|----|-----------|------|
| RF-17 | Cada documento tem status: `vazio`, `rascunho`, `em-validacao`, `validado`. | P0 |
| RF-18 | O status é visível (selo) em cards, índices, cabeçalho da página e home, e editável na página. | P0 |
| RF-19 | Um documento sem nenhum conteúdo preenchido é `vazio`; ao salvar o primeiro conteúdo, passa a `rascunho` (a fundadora pode alterar manualmente). | P1 |

### 4.5 Grade/lista e tema

| ID | Requisito | Prio |
|----|-----------|------|
| RF-20 | Toda coleção (home, índice, itens) usa **cards, nunca tabelas**. Onde há alternância, um Select "Grade / Lista" muda o layout; as coleções do relatório (leads, personas) são sempre cards em lista. | P0 |
| RF-21 | A preferência grade/lista é lembrada no navegador; se o armazenamento estiver indisponível, o app funciona com o padrão (grade). | P0 |
| RF-22 | Tema escuro é o padrão; há alternância para claro, lembrada entre sessões. | P0 |

### 4.6 API de contexto para agentes

| ID | Requisito | Prio |
|----|-----------|------|
| RF-23 | `GET /api/context` devolve todos os documentos (13) em JSON (id, metadados, campos, itens, corpo). | P0 |
| RF-24 | `GET /api/context?format=md` devolve todos os documentos como Markdown concatenado, pronto para colar em prompt. | P0 |
| RF-25 | `GET /api/context/[secao]/[pagina]` devolve um documento (JSON; `?format=md` devolve o `.md` do documento). | P0 |
| RF-26 | `PUT /api/context/[secao]/[pagina]` valida o documento contra o schema da página e o grava; rejeita com erro descritivo (400) se inválido. | P0 |
| RF-27 | Escritas via API exigem `atualizado_por: agente:<nome>` e atualizam `atualizado_em`. | P0 |
| RF-28 | Documento inexistente ou id inválido retorna 404; nunca permite acesso a documentos fora da navegação nem de outro usuário (RLS). | P0 |

### 4.7 Agentes e skills (arquivos)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-29 | `AGENTS.md` na raiz descreve como um agente lê e escreve o contexto: ids, schema, regras de escrita (respeitar schema, identificar-se, não apagar campos humanos). | P0 |
| RF-30 | `agents/<nome>.md` define cada agente com front matter: nome, papel, páginas que lê, páginas que escreve, skills. | P0 |
| RF-31 | `skills/<nome>/SKILL.md` define cada skill reutilizável por agentes. | P0 |
| RF-32 | A Fase 1 entrega ao menos 1 agente e 1 skill de exemplo, para validar o contrato. | P1 |
| RF-33 | (F2, parcial) A UI lista os agentes e o que cada um faz (ver RF-41). Falta listar skills e revisar sugestões de agentes antes de aplicar. | F2 |

### 4.8 Persistência, contas e arquivos

| ID | Requisito | Prio |
|----|-----------|------|
| RF-34 | (F3) Persistência no Supabase sem mudar a UI nem a API, apenas a implementação do repositório. Documento ausente = template vazio. | F3 |
| RF-34a | (F3) Login por Supabase Auth; cada usuário só lê e escreve o que é seu (RLS `user_id = auth.uid()`). O 1º usuário é admin e recebe o conteúdo atual; novos usuários começam com cards vazios. | F3 |
| RF-34b | (F3) Bucket privado `arquivos` (imagens, PDF, TXT, DOCX, com limite de tamanho) com metadados na tabela `arquivos`. Botão de upload na UI: ainda não. | F3 |
| RF-34c | (F3) Histórico de versões e permissões por agente. | Depois |

### 4.9 Aprovação

| ID | Requisito | Prio |
|----|-----------|------|
| RF-35 | O relatório tem o botão **Aprovar**, que marca a página como `validado` sem abrir a edição, com aviso de conflito se a página mudou desde a abertura. | P0 |

### 4.10 Passo a passo (`/comecar`)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-36 | Onboarding com **uma pergunta por vez** para as seções Founder e Direção, com revisão no fim. Validação e Caixa ficam de fora, pois dependem de dados do negócio rodando. | P0 |

### 4.11 Briefing (`/briefing`)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-37 | O briefing mostra a análise das respostas da fundadora feita pela IA, com a completude geral e botão para gerar de novo. | P0 |
| RF-38 | As chamadas ao Claude usam o CLI local (`claude -p`, sem chave de API), rodam só no servidor, sem ferramentas (o modelo só lê o contexto e responde) e com tempo limite. | P0 |
| RF-39 | O editor tem "Pedir à IA", que sugere valores para campos vazios; o botão só aparece quando a ação está disponível. | P1 |

### 4.12 Oportunidades (`/oportunidades`)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-40 | Funil **Kanban** dos leads, do primeiro contato ao ganho ou perdido (estágios: novo, contato, proposta, negociação, ganho, perdido). Mover um cartão é arrastar (mouse, toque e teclado). Persistência na tabela `oportunidades` (jsonb, por usuário). | P0 |

### 4.13 Workflow e Agentes (`/workflow`, `/agentes`)

| ID | Requisito | Prio |
|----|-----------|------|
| RF-41 | `/agentes` lista cada agente definido em `agents/*.md`, o que lê e escreve e se está trabalhando agora. | P0 |
| RF-42 | `/workflow` mostra em Kanban (fila, trabalhando, revisão, concluída) o que cada agente está fazendo e em quais documentos, com atualização automática. As tarefas ficam na tabela `tarefas` (jsonb, por usuário) e `/api/workflow` (GET e POST) permite que agentes leiam e registrem tarefas; o quadro guarda no máximo 200, descartando as concluídas mais antigas. | P0 |

---

## 5. As 13 páginas

Cada bloco: objetivo, perguntas-chave e decisão que destrava. Os campos exatos ficam na spec.

### 5.1 FOUNDER

**founder/objetivo — Objetivo**
- **Objetivo:** registrar por que o negócio existe para a fundadora e o que ela quer alcançar.
- **Perguntas-chave:** O que eu quero que este negócio me dê? Em quanto tempo? Como saberei que deu certo?
- **Destrava:** decidir se vale investir tempo e dinheiro e o que conta como sucesso; é o critério de corte para todas as outras escolhas.

**founder/estilo-de-vida — Estilo de Vida**
- **Objetivo:** documentar as restrições e preferências pessoais que o negócio precisa respeitar.
- **Perguntas-chave:** Quantas horas por semana posso dedicar? Que rotina quero ter? O que não aceito abrir mão? Qual renda mínima preciso?
- **Destrava:** decidir o formato do negócio (ritmo, modelo, tipo de operação) compatível com a vida que ela quer.

### 5.2 DIREÇÃO

**direcao/mapa-de-mercado — Mapa de Mercado**
- **Objetivo:** mapear o terreno: segmentos, concorrentes e espaços livres.
- **Perguntas-chave:** Quem atua neste mercado? Quais segmentos existem e qual o tamanho? Onde estão as lacunas?
- **Destrava:** decidir em qual segmento entrar e quais concorrentes enfrentar.

**direcao/ima-de-problemas — Imã de Problemas**
- **Objetivo:** listar e priorizar problemas reais que atraem clientes dispostos a pagar.
- **Perguntas-chave:** Quais problemas são frequentes, urgentes e caros para o cliente? Qual eu consigo resolver melhor? Que evidências tenho?
- **Destrava:** decidir qual problema resolver primeiro.

**direcao/perfil-de-cliente-ideal — Perfil de Cliente Ideal**
- **Objetivo:** definir com precisão quem é o cliente que mais sente o problema escolhido, em um perfil geral e em **personas** distintas (uma por ambiente e necessidade; hoje uma por segmento do Mapa de Mercado).
- **Perguntas-chave:** Quem é? Onde está? Como decide e compra? O que já tentou? Quem **não** é cliente? Que eventos concretos (gatilhos) fazem cada persona agir agora?
- **Destrava:** decidir para quem vender e quem ignorar; orienta canais, linguagem e a busca de leads.

**direcao/tese-de-valor — Tese de Valor**
- **Objetivo:** formular a hipótese central: por que este cliente escolheria esta solução em vez das alternativas.
- **Perguntas-chave:** Que resultado entrego? Por que sou diferente? Quais premissas precisam ser verdade?
- **Destrava:** decidir o posicionamento e quais premissas testar na validação.

**direcao/oferta — Oferta**
- **Objetivo:** desenhar a oferta: o que será vendido, para quem, por quanto e com quais condições.
- **Perguntas-chave:** O que está incluído? Qual o preço e o porquê? Qual a garantia? Como é entregue?
- **Destrava:** decidir a versão da oferta que será levada ao mercado para teste.

### 5.3 VALIDAÇÃO

**validacao/oferta — Oferta**
- **Objetivo:** testar a oferta desenhada no mercado e registrar o que mudou (distinta de `direcao/oferta`).
- **Perguntas-chave:** Qual versão estou testando? Qual o critério de sucesso? O que o mercado respondeu? O que ajustei?
- **Destrava:** decidir se mantém, ajusta ou descarta a oferta (persistir, pivotar ou parar).

**validacao/leads — Leads**
- **Objetivo:** mini CRM das empresas e contatos que os agentes de prospecção encontram, do primeiro achado até a conversa.
- **Perguntas-chave:** O que faz uma empresa entrar na lista? Onde os agentes buscam? Quantos leads qualificados já tenho frente à meta? Que regras os agentes seguem?
- **Destrava:** decidir quem abordar primeiro e quando a lista basta para iniciar as conversas do teste.

**validacao/primeiros-clientes — Primeiros Clientes**
- **Objetivo:** acompanhar os primeiros clientes e conversas de venda como evidência de validação.
- **Perguntas-chave:** Quem são? De onde vieram? Quanto pagaram? O que disseram? Há padrões nos que compraram e nos que recusaram?
- **Destrava:** decidir se há demanda real o bastante para escalar e qual canal repetir.

**validacao/fluxo-de-caixa — Fluxo de Caixa**
- **Objetivo:** controlar o caixa mínimo do período de teste (distinta de `caixa/fluxo-de-caixa`).
- **Perguntas-chave:** Quanto posso gastar no teste? Quanto entrou e saiu? Quantos meses de fôlego tenho?
- **Destrava:** decidir quanto investir no teste e quando parar por limite de caixa.

### 5.4 CAIXA

**caixa/fluxo-de-caixa — Fluxo de Caixa**
- **Objetivo:** acompanhar a operação recorrente: entradas, saídas e projeção.
- **Perguntas-chave:** Qual o saldo e a projeção dos próximos meses? Quais custos fixos e variáveis? Qual a margem?
- **Destrava:** decidir gastos, preço, retirada da fundadora e momento de contratar ou investir.

**caixa/erp — ERP**
- **Objetivo:** definir a base operacional: sistemas, processos e controles necessários para operar e faturar.
- **Perguntas-chave:** Que ferramentas uso para vender, cobrar, emitir nota e controlar estoque/serviços? O que está manual? O que automatizar?
- **Destrava:** decidir quais ferramentas contratar e o que padronizar antes de crescer.

---

## 6. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| RNF-01 | **Mobile-first:** todas as telas usáveis em 375 px de largura, sem rolagem horizontal; alvos de toque >= 44 px. |
| RNF-02 | **Acessibilidade WCAG 2.1 AA:** contraste >= 4,5:1 entre texto e fundo nos dois temas, foco visível, navegação por teclado, rótulos em todos os campos, `aria-live` para confirmação de salvamento. |
| RNF-03 | **Performance:** carregamento de página < 1 s em localhost; salvar < 300 ms; `GET /api/context` < 500 ms com os 13 documentos. |
| RNF-04 | **Exportável e legível por humanos:** a exportação `.md` (backup) usa front matter YAML, chaves em ordem estável e sem metadados binários, para que diffs sejam pequenos e revisáveis. |
| RNF-05 | **Idioma:** UI, documentação e comentários de código em português do Brasil. |
| RNF-06 | **Design:** minimalista, cards em vez de tabelas e bordas arredondadas. **Fonte:** IBM Plex Mono em toda a interface; Cormorant Garamond só nos títulos de página (uso moderado). **Cor:** tema escuro por padrão (fundo Carvão `#373634`, destaque Verde `#e4fe65`, texto de apoio Grisalho `#b0c2c2`); tema claro com Branco Lunar `#efefef` e Carvão. O número da persona e a frase de destaque usam a cor primária. |
| RNF-07 | **Robustez de gravação:** uma gravação falha não deve corromper o documento (operação atômica no banco; no modo `fs`, arquivo temporário + rename). |
| RNF-08 | **Validação:** todo documento é validado por schema antes de gravar (UI e API). |
| RNF-09 | **Segurança:** ver abaixo (RLS, service role, token da API, LGPD). |

### Segurança — risco explícito

- **Isolamento por RLS.** Todas as tabelas de `public` têm RLS com a política "dono vê e edita só o que é seu". Tabela sem RLS ou política errada expõe os dados de todos; revisar com os advisors do Supabase a cada migração.
- **Service role.** `SUPABASE_SERVICE_ROLE_KEY` ignora RLS; só no servidor e em scripts, nunca com prefixo `NEXT_PUBLIC_`, nunca no repositório. A API de agentes (`/api/context`, Bearer `BUSINESSOS_API_TOKEN`) usa o cliente admin e atua como `BUSINESSOS_API_USER_ID`; em produção sem token, a API inteira responde 403.
- **Mitigações técnicas mínimas:** validar `secao`/`pagina` contra a navegação; validar com schema; limitar o corpo da requisição (256 KiB); sem CORS.
- **Credenciais do admin** (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) só na linha de comando, nunca em arquivo.
- **IA no servidor.** `ANTHROPIC_API_KEY` só no servidor. No modo `cli`, o `claude -p` roda na máquina do servidor, sem ferramentas; use esse modo apenas localmente.
- **LGPD.** Dados pessoais de leads ficam no Supabase, região us-east-1 (transferência internacional): ver `04-lgpd-prospeccao.md`.
- **Deploy:** liberado em princípio pela autenticação e RLS, mas só depois de revisar as políticas, definir o token da API e resolver os pontos de LGPD.

---

## 7. User stories principais

**US-01 — Navegar entre as páginas**
Como fundadora, quero ver todas as seções e páginas na sidebar para chegar a qualquer página em um clique.
- Dado que estou em qualquer página, quando passo o mouse sobre um item da sidebar, então o item recebe destaque de fundo.
- Dado que estou em uma página, quando olho a sidebar, então o item correspondente aparece destacado como ativo.
- Dado um celular (375 px), quando toco no botão de menu, então a sidebar abre como painel e fecha ao escolher uma página.

**US-02 — Ver o progresso do negócio**
Como fundadora, quero ver na home o progresso de cada seção para saber o que falta preencher.
- Dado que tenho 13 páginas, quando abro a home, então vejo um card por seção com contagem de páginas por status.
- Dado que mudei o status de uma página, quando volto à home, então o progresso reflete a mudança.

**US-03 — Preencher e salvar uma página**
Como fundadora, quero editar campos e salvar para registrar uma decisão.
- Dado que abri `direcao/oferta`, quando edito um campo e clico em Salvar, então o documento `direcao/oferta` é atualizado no banco e vejo confirmação.
- Dado que salvei, então `atualizado_em` é atualizado e `atualizado_por` é `humano`.
- Dado que o salvamento falha, quando clico em Salvar, então vejo uma mensagem de erro e meu texto continua na tela.

**US-04 — Gerenciar itens de uma coleção**
Como fundadora, quero adicionar e editar itens (ex.: primeiros clientes) como cards.
- Dado que estou em `validacao/primeiros-clientes`, quando adiciono um item e salvo, então ele aparece como card após recarregar.
- Dado que removo um item e salvo, então ele deixa de existir no documento.

**US-05 — Alternar grade/lista**
Como fundadora, quero alternar entre grade e lista para ver as informações do jeito que prefiro.
- Dado qualquer coleção de cards, quando escolho "Lista" no Select, então os cards passam a ser exibidos em uma coluna.
- Dado que escolhi "Lista", quando recarrego a página, então a preferência é mantida.

**US-06 — Definir o status de uma página**
Como fundadora, quero marcar uma página como rascunho, em validação ou validada para sinalizar a maturidade da decisão.
- Dado uma página `vazio`, quando salvo o primeiro conteúdo, então o status passa a `rascunho`.
- Dado que alterei o status para `validado` e salvei, então o selo aparece em cards, índice e home.

**US-07 — Alternar tema**
Como fundadora, quero alternar entre tema escuro e claro.
- Dado a primeira visita, quando abro o app, então o tema é escuro.
- Dado que escolhi claro, quando recarrego, então o tema claro é mantido.

**US-08 — Agente lê o contexto completo**
Como agente de IA, quero obter todo o contexto do negócio em uma chamada.
- Dado o app rodando localmente, quando faço `GET /api/context`, então recebo os 13 documentos em JSON.
- Dado `?format=md`, então recebo Markdown concatenado com o id e o título de cada documento.

**US-09 — Agente escreve em um documento**
Como agente de IA, quero atualizar um documento respeitando o schema.
- Dado um corpo válido com `atualizado_por: agente:analista`, quando faço `PUT /api/context/direcao/oferta`, então o documento é gravado e retorna 200.
- Dado um corpo que viola o schema, então recebo 400 com a descrição do erro e o documento não muda.
- Dado um id que não existe na navegação, então recebo 404.

**US-10 — Humano e agente editam o mesmo documento**
Como fundadora, quero ser avisada se um agente alterou a página enquanto eu editava.
- Dado que abri uma página e um agente a gravou depois, quando clico em Salvar, então vejo aviso de conflito e minha edição não sobrescreve a do agente sem confirmação.

**US-11 — Ler e editar um item na gaveta**
Como fundadora, quero abrir um item da coleção (ex.: uma persona ou um lead) sem sair do relatório.
- Dado um card de persona ou de lead, quando clico nele, então abre uma gaveta lateral com todos os campos do item.
- Dado a gaveta aberta, quando clico em Editar e salvo, então só aquele item é atualizado e vejo confirmação.
- Dado que a página mudou enquanto eu editava, quando salvo, então vejo o aviso de conflito.

**US-12 — Definir as personas de cliente**
Como fundadora, quero personas distintas, cada uma com momento, contexto e gatilhos, para saber a quem abordar e quando.
- Dado `direcao/perfil-de-cliente-ideal`, quando olho a coleção de personas, então cada card mostra número, nome, frase, perfil, momento e até 3 gatilhos.
- Dado uma persona com mais de 3 gatilhos, então o card mostra "+N" e a gaveta lista todos.

**US-13 — Responder o passo a passo**
Como fundadora, quero responder uma pergunta por vez para preencher Founder e Direção sem encarar 13 páginas.
- Dado `/comecar`, quando respondo e avanço, então a resposta é salva na página correspondente e, no fim, vejo uma revisão.

**US-14 — Acompanhar leads e agentes**
Como fundadora, quero ver o funil de oportunidades e o que cada agente está fazendo.
- Dado `/oportunidades`, quando movo um lead de coluna, então o estágio é gravado.
- Dado `/workflow`, quando um agente registra uma tarefa, então ela aparece na coluna certa sem eu recarregar.

---

## 8. Riscos, dependências e perguntas em aberto

### 8.1 Riscos

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| R1 | RLS mal configurada ou vazamento da service role expõe dados de todos os usuários | Alto | RLS em toda tabela; service role só no servidor; token na API; advisors do Supabase; exportação `.md` como backup |
| R2 | Agente sobrescreve conteúdo humano | Alto | Regras em `AGENTS.md`; `atualizado_por`; detecção de conflito (RF-16); revisão humana na Fase 2 |
| R3 | Escrita simultânea (humano e agente) causa perda de dados | Médio | Escrita atômica (RNF-07); aviso de conflito por `atualizado_em`; histórico de versões depois |
| R4 | Sistema de arquivos não funciona em hospedagem serverless (Vercel) | Médio | Resolvido pela migração para o Supabase (padrão `BUSINESSOS_STORAGE=supabase`) |
| R5 | Schemas por página mudam e quebram documentos existentes | Médio | Schemas versionados na spec; validação com mensagens claras |
| R6 | Escopo cresce (agentes ativos, auth) antes de validar a Fase 1 | Médio | Fases fixas; funcionalidades fora do escopo vão para o backlog |
| R8 | A IA roda no servidor: modo `cli` executa o `claude` local; modo `api` usa `ANTHROPIC_API_KEY` | Médio | Sem ferramentas, só texto; tempo limite; chave só no servidor; `cli` só local; `BUSINESSOS_IA=desligada` desliga |
| R7 | Páginas duplicadas por nome ("Oferta", "Fluxo de Caixa") confundem usuária e agentes | Baixo | Ids com seção (`direcao/oferta`); selo da seção visível no cabeçalho; descrição distinta |

### 8.2 Dependências

- Stack definida: Next.js, TypeScript, Tailwind v4, shadcn/ui, next-themes, gray-matter, zod, Storybook; Node 24 e npm; fontes IBM Plex Mono e Cormorant Garamond (next/font).
- IA: `ANTHROPIC_API_KEY` (modo `api`) ou Claude Code CLI instalado e autenticado na máquina (modo `cli`), para briefing e "Pedir à IA".
- `03-spec.md` define os schemas dos campos de cada uma das 13 páginas.
- Projeto Supabase "BusinessOS" (ref `hhqdynsttdhnllmgrddu`, Postgres 17, região us-east-1).

### 8.3 Perguntas em aberto

1. **Deploy:** *respondida em parte:* a Fase 3 (auth + Supabase) foi antecipada, então o app já pode sair da máquina local. Falta decidir onde publicar e fechar os pontos de LGPD.
2. **Modelo de status:** o status é sempre manual, ou o sistema deve sugerir `rascunho`/`em-validacao` por regras (ex.: campos obrigatórios preenchidos)?
3. **Conflito humano x agente:** basta avisar e pedir confirmação (proposto), ou a escrita de agentes deve sempre virar "sugestão" a aprovar já na Fase 1?
4. **Exportação:** além de `?format=md`, é necessário exportar PDF/arquivo único para compartilhar com mentores/contador?
5. **Páginas e estágios:** o selo "Para quem está começando" é fixo ou mudará (outros estágios com outras páginas)?
6. **Agentes iniciais:** *respondida em parte:* existem 13 agentes em `agents/` (um por página, mais assistente de arranque, resumo, revisor de contexto, validação e prospecção de leads) e a skill `contexto-businessos`. Falta decidir quais viram execução pela UI.
7. **Metas de sucesso:** as metas das seções 1.3 (13 de 13 em 30 dias; 4 validadas em 60 dias) são realistas para ela?
8. **Idioma do conteúdo dos agentes:** agentes devem sempre escrever em português do Brasil? (proposto: sim)
