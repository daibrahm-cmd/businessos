# BusinessOS — Briefing

> Documento 01 de 03 (briefing, PRD, spec). Estágio do negócio: **Para quem está começando**.

## 1. Contexto e problema

Quem está começando um negócio decide no escuro. As informações essenciais (objetivo, mercado, cliente, oferta, caixa) vivem espalhadas em notas, planilhas, conversas e na cabeça da fundadora. Não existe um lugar único em que o negócio esteja descrito de forma clara, atual e consultável.

Isso piora com IA: assistentes e agentes respondem sem contexto, geram conselhos genéricos e obrigam a fundadora a reexplicar o negócio a cada conversa. O resultado são decisões lentas, inconsistentes e difíceis de revisar depois.

## 2. Visão e proposta de valor

**BusinessOS é a inteligência do negócio: um sistema de tomada de decisão.**

A fundadora escreve e salva as informações do negócio em páginas com campos. Agentes de IA e skills leem e escrevem o **mesmo conteúdo**, trabalhando junto com ela para desenvolver o negócio. O conteúdo é Markdown com front matter (YAML), então o contexto fica versionável, legível por humanos e pronto para ser consumido por IA.

Proposta de valor:

- Um único contexto do negócio, sempre atual, que humano e agentes compartilham.
- Decisões apoiadas em informação estruturada, e não em memória ou improviso.
- Agentes que partem do contexto real, sem reexplicação.
- Conteúdo em arquivos portáveis, sem dependência de um fornecedor.

## 3. Público

**Fundador(a) no estágio "Para quem está começando"**: pessoa que está tirando um negócio do papel, sozinha ou com time mínimo, sem estrutura de gestão e sem tempo para ferramentas complexas. Usa o celular com frequência e quer clareza, não configuração.

## 4. A jornada em 4 etapas, 12 páginas

A navegação segue o caminho natural de quem começa: entender a si mesma, definir direção, validar no mercado e controlar o caixa.

| Etapa | Página | Papel |
|-------|--------|-------|
| **Founder** | Objetivo | Registra o que a fundadora quer alcançar com o negócio e em que prazo. |
| | Estilo de Vida | Define a vida que o negócio precisa sustentar (tempo, renda, limites). |
| **Direção** | Mapa de Mercado | Organiza segmentos, concorrentes e espaços livres do mercado. |
| | Imã de Problemas | Lista os problemas que atraem clientes e merecem ser resolvidos. |
| | Perfil de Cliente Ideal | Descreve quem é o cliente, o que o move e onde encontrá-lo. |
| | Tese de Valor | Declara por que este negócio é a melhor resposta ao problema escolhido. |
| | Oferta | **Desenha** a oferta: o que é vendido, para quem, a que preço. |
| **Validação** | Oferta | **Testa** a oferta no mercado e registra o que a realidade respondeu. |
| | Primeiros Clientes | Acompanha os primeiros clientes e o aprendizado de cada venda. |
| | Fluxo de Caixa | Registra o caixa mínimo necessário para rodar o teste. |
| **Caixa** | Fluxo de Caixa | Controla entradas e saídas da operação recorrente. |
| | ERP | Reúne a visão operacional e financeira consolidada do negócio. |

**Por que Oferta e Fluxo de Caixa aparecem duas vezes?** São páginas distintas, com conteúdo próprio, e não atalhos. O tema é o mesmo, mas o momento muda: em Direção a oferta é *desenhada*, em Validação ela é *testada*; em Validação o fluxo de caixa cobre o *caixa mínimo do teste*, em Caixa cobre a *operação recorrente*. Cada uma tem seu documento (`direcao/oferta` e `validacao/oferta`, por exemplo), o que evita misturar hipótese com evidência.

## 5. Princípios

1. **Contexto como fonte da verdade.** O que está nas páginas (Markdown + front matter) é o que vale, para a fundadora e para os agentes.
2. **Humano no controle.** Agentes propõem e preenchem, mas a fundadora decide. Toda alteração indica quem a fez (`humano` ou `agente:<nome>`) e campos humanos não são apagados por agentes.
3. **Simplicidade.** Sem framework ou camada que não se pague. Tabelas dão lugar a cards. Cada página faz uma coisa.
4. **Mobile-first.** Tudo precisa funcionar bem no celular antes de funcionar no desktop.

## 6. Diretrizes de marca e design (resumo)

- Minimalista, **preto e branco**, sem cor de acento.
- Tipografia **Inter**.
- Bordas arredondadas (raio de 0,75rem).
- **Dark mode por padrão**, com alternância para claro.
- Sidebar com destaque no hover e no item ativo; no mobile vira painel deslizante.
- **Cards em vez de tabelas**, com opção de alternar entre **grade** e **lista**.
- Interface calma, com muito espaço em branco e hierarquia clara.

## 7. Restrições e premissas

- **Sem banco de dados agora.** O conteúdo vive em arquivos `content/<secao>/<pagina>.md`. **Supabase** é o destino futuro, atrás da mesma interface de acesso, sem instalar SDK nesta fase.
- **Stack:** Next.js (App Router, TypeScript), Tailwind CSS v4, shadcn/ui, Storybook para componentes, `gray-matter` e `zod` para front matter e validação.
- Agentes e skills são **arquivos** (`AGENTS.md`, `agents/`, `skills/`), não uma interface, nesta fase.
- Agentes externos acessam o contexto por rotas de API (`/api/context`).
- Tudo em português do Brasil. Uso individual (uma fundadora, um negócio).
- Premissa: Markdown + front matter é suficiente para representar as 12 páginas; os campos exatos serão definidos na spec.

## 8. Fora de escopo nesta fase

- Banco de dados e integração com Supabase.
- Autenticação, múltiplos usuários, permissões e colaboração em tempo real.
- Interface de gestão de agentes e skills (ficam como arquivos).
- Execução automática de agentes dentro do app.
- Estágios do negócio além de "Para quem está começando".
- Integrações externas (bancos, contabilidade, CRMs) e ERP real: a página ERP é apenas a visão consolidada.
- Histórico de versões na interface e app nativo.

## 9. Métricas de sucesso

**Quantitativas**

- As 12 páginas preenchidas até `status: validado` ou `em-validacao` em até 2 semanas de uso.
- Pelo menos 80% das páginas com `atualizado_em` nos últimos 30 dias.
- Um agente consegue ler todo o contexto por `GET /api/context` e escrever em uma página respeitando o schema, sem erro de validação.
- Salvar uma página leva menos de 2 segundos e a interface é utilizável em tela de 375px.

**Qualitativas**

- A fundadora consegue explicar o negócio olhando só para o BusinessOS.
- Agentes dão respostas específicas ao negócio, sem precisar de reexplicação.
- A fundadora relata decidir com mais segurança e rapidez.
- A interface é percebida como simples, calma e agradável no celular.
