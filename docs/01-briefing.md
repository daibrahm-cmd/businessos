# BusinessOS — Briefing

> Documento 01 de 03 (briefing, PRD, spec). Estágio do negócio: **Para quem está começando** (selo na interface: "Sistema de marca viva").
> Atualizado em 2026-11-09 (v1.1): 13 páginas, personas de cliente, novas telas e design real.

## 1. Contexto e problema

Quem está começando um negócio decide no escuro. As informações essenciais (objetivo, mercado, cliente, oferta, caixa) vivem espalhadas em notas, planilhas, conversas e na cabeça da fundadora. Não existe um lugar único em que o negócio esteja descrito de forma clara, atual e consultável.

Isso piora com IA: assistentes e agentes respondem sem contexto, geram conselhos genéricos e obrigam a fundadora a reexplicar o negócio a cada conversa. O resultado são decisões lentas, inconsistentes e difíceis de revisar depois.

## 2. Visão e proposta de valor

**BusinessOS é a inteligência do negócio: um sistema de tomada de decisão.**

A fundadora escreve e salva as informações do negócio em páginas com campos. Agentes de IA e skills leem e escrevem o **mesmo conteúdo**, trabalhando junto com ela para desenvolver o negócio. O conteúdo fica em um banco de dados (Supabase), isolado por usuário, e pode ser exportado em Markdown com front matter (YAML), legível por humanos e pronto para ser consumido por IA.

Proposta de valor:

- Um único contexto do negócio, sempre atual, que humano e agentes compartilham.
- Decisões apoiadas em informação estruturada, e não em memória ou improviso.
- Agentes que partem do contexto real, sem reexplicação.
- Conteúdo exportável a qualquer momento em arquivos Markdown portáveis (backup), mesmo guardado em um banco.

## 3. Público

**Fundador(a) no estágio "Para quem está começando"**: pessoa que está tirando um negócio do papel, sozinha ou com time mínimo, sem estrutura de gestão e sem tempo para ferramentas complexas. Usa o celular com frequência e quer clareza, não configuração.

## 4. A jornada em 4 etapas, 13 páginas

A navegação segue o caminho natural de quem começa: entender a si mesma, definir direção, validar no mercado e controlar o caixa. Além das 13 páginas, a interface tem telas de apoio: **Início**, **Passo a passo** (onboarding com uma pergunta por vez), **Briefing** (análise das respostas pelo Claude local), **Oportunidades** (funil Kanban dos leads), **Workflow** (o que cada agente está fazendo) e **Agentes**.

| Etapa | Página | Papel |
|-------|--------|-------|
| **Founder** | Objetivo | Registra o que a fundadora quer alcançar com o negócio e em que prazo. |
| | Estilo de Vida | Define a vida que o negócio precisa sustentar (tempo, renda, limites). |
| **Direção** | Mapa de Mercado | Organiza segmentos, concorrentes e espaços livres do mercado. |
| | Imã de Problemas | Lista os problemas que atraem clientes e merecem ser resolvidos. |
| | Perfil de Cliente Ideal | Descreve quem é o cliente, o que o move e onde encontrá-lo, em um perfil geral e em **personas** distintas (momento, contexto e gatilhos de cada uma). |
| | Tese de Valor | Declara por que este negócio é a melhor resposta ao problema escolhido. |
| | Oferta | **Desenha** a oferta: o que é vendido, para quem, a que preço. |
| **Validação** | Oferta | **Testa** a oferta no mercado e registra o que a realidade respondeu. |
| | Leads | Mini CRM: as empresas e contatos que os agentes de prospecção encontram, do primeiro achado até a conversa. |
| | Primeiros Clientes | Acompanha os primeiros clientes e o aprendizado de cada venda. |
| | Fluxo de Caixa | Registra o caixa mínimo necessário para rodar o teste. |
| **Caixa** | Fluxo de Caixa | Controla entradas e saídas da operação recorrente. |
| | ERP | Reúne a visão operacional e financeira consolidada do negócio. |

**Por que Oferta e Fluxo de Caixa aparecem duas vezes?** São páginas distintas, com conteúdo próprio, e não atalhos. O tema é o mesmo, mas o momento muda: em Direção a oferta é *desenhada*, em Validação ela é *testada*; em Validação o fluxo de caixa cobre o *caixa mínimo do teste*, em Caixa cobre a *operação recorrente*. Cada uma tem seu documento (`direcao/oferta` e `validacao/oferta`, por exemplo), o que evita misturar hipótese com evidência.

## 5. Princípios

1. **Contexto como fonte da verdade.** O que está nas páginas (guardado no Supabase) é o que vale, para a fundadora e para os agentes.
2. **Humano no controle.** Agentes propõem e preenchem, mas a fundadora decide. Toda alteração indica quem a fez (`humano` ou `agente:<nome>`) e campos humanos não são apagados por agentes.
3. **Simplicidade.** Sem framework ou camada que não se pague. Tabelas dão lugar a cards. Cada página faz uma coisa.
4. **Mobile-first.** Tudo precisa funcionar bem no celular antes de funcionar no desktop.

## 6. Diretrizes de marca e design (resumo)

Identidade visual DB, com paleta oficial: **Carvão** `#373634`, **Grisalho** `#B0C2C2`, **Marinho** `#3F495A`, **Verde** `#E4FE65` e **Branco Lunar** `#EFEFEF`.

- Minimalista. **Dark mode por padrão** (fundo Carvão, destaque Verde), com alternância para o claro (Branco Lunar e Carvão, sem Verde).
- Tipografia **IBM Plex Mono** em toda a interface; **Cormorant Garamond** só nos títulos de página, com uso moderado.
- Bordas arredondadas (raio de 0,75rem).
- Sidebar com destaque no hover e no item ativo; no mobile vira painel deslizante.
- **Cards em vez de tabelas**. Páginas abrem em relatório de leitura com hierarquia visual clara (por exemplo, o card de persona: número grande, nome, frase de destaque, perfil, momento e gatilhos em chips); itens de coleção abrem numa gaveta lateral.
- Interface calma, com muito espaço e hierarquia clara.

## 7. Restrições e premissas

- **Banco de dados: Supabase** (Postgres com RLS, Auth e Storage), decidido em [decisions/0001](./decisions/0001-banco-de-dados-supabase-em-vez-de-markdown.md). Cada usuário só vê o que é seu. Os arquivos `content/<secao>/<pagina>.md` ficam só como exportação/backup e fonte da migração inicial; `BUSINESSOS_STORAGE=fs` ainda existe como chave de troca, mas o padrão é `supabase`.
- **Stack:** Next.js (App Router, TypeScript), Tailwind CSS v4, shadcn/ui (estilo radix-nova), Storybook para componentes, `gray-matter` e `zod` para front matter e validação, `@dnd-kit` para os Kanbans.
- **IA:** o briefing e o "Pedir à IA" passam por um provedor único com dois modos, só no servidor: `api` (usa `ANTHROPIC_API_KEY`) e `cli` (o `claude -p` instalado na máquina). Com a chave definida o padrão é `api`; sem ela, `cli`. A chave será colocada depois ("cabos soltos").
- Agentes e skills são definidos em **arquivos** (`AGENTS.md`, `agents/`, `skills/`). A interface lista os agentes e mostra o que cada um está fazendo (Agentes e Workflow); ela ainda não os executa.
- Agentes externos acessam o contexto por rotas de API (`/api/context`, Bearer token) e registram o que estão fazendo em `/api/workflow`, atuando como o usuário `BUSINESSOS_API_USER_ID`. Leads e tarefas ficam nas tabelas `oportunidades` e `tarefas` do Supabase. Anexos (imagens, PDF, TXT, DOCX) vão para o bucket privado `arquivos`; ainda sem botão de upload na interface.
- Tudo em português do Brasil. Multiusuário: cada pessoa tem o seu negócio, isolado por login. O primeiro usuário é admin e recebe o conteúdo atual; novos usuários começam com cards vazios.
- Premissa: campos estruturados (jsonb) + notas em Markdown são suficientes para representar as 13 páginas; os campos exatos estão na spec (gerados dos schemas).

## 8. Fora de escopo nesta fase

- Colaboração em tempo real e compartilhamento do mesmo negócio entre usuários (cada usuário tem o seu; sem papéis nem equipes).
- Botão de upload de arquivos na interface (o armazenamento já existe).
- Interface de **edição** de skills e de gestão avançada de agentes (a lista de agentes e o quadro de workflow já existem).
- Execução automática de agentes dentro do app (só o briefing e o "Pedir à IA" chamam a IA, de forma pontual).
- Estágios do negócio além de "Para quem está começando".
- Integrações externas (bancos, contabilidade, CRMs) e ERP real: a página ERP é apenas a visão consolidada.
- Histórico de versões na interface e app nativo.

## 9. Métricas de sucesso

**Quantitativas**

- As 13 páginas preenchidas até `status: validado` ou `em-validacao` em até 2 semanas de uso.
- Pelo menos 80% das páginas com `atualizado_em` nos últimos 30 dias.
- Um agente consegue ler todo o contexto por `GET /api/context` e escrever em uma página respeitando o schema, sem erro de validação.
- Salvar uma página leva menos de 2 segundos e a interface é utilizável em tela de 375px.

**Qualitativas**

- A fundadora consegue explicar o negócio olhando só para o BusinessOS.
- Agentes dão respostas específicas ao negócio, sem precisar de reexplicação.
- A fundadora relata decidir com mais segurança e rapidez.
- A interface é percebida como simples, calma e agradável no celular.
