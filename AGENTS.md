# AGENTS.md — Como agentes leem e escrevem o contexto do BusinessOS

## O que é

O BusinessOS é um app local que organiza o contexto de um negócio em 13 páginas, divididas em 4 seções (Founder, Direção, Validação e Caixa). Cada página é um arquivo `content/<secao>/<pagina>.md` (front matter YAML + notas em Markdown), o mesmo conteúdo que a fundadora edita na interface. Agentes leem e escrevem esse contexto pela API (`/api/context`) ou, com o app parado, direto nos arquivos.

## Mapa de documentos

Os ids são `<secao>/<pagina>`. Atenção: há títulos repetidos ("Oferta" e "Fluxo de Caixa"); sempre use o id.

| Id | Título | Descrição |
|---|---|---|
| `founder/objetivo` | Objetivo | Por que este negócio existe para você e o que precisa ser verdade em 12 meses. |
| `founder/estilo-de-vida` | Estilo de Vida | As restrições e preferências pessoais que o negócio precisa respeitar. |
| `direcao/mapa-de-mercado` | Mapa de Mercado | O terreno onde você vai jogar: segmentos, concorrentes e espaços livres. |
| `direcao/ima-de-problemas` | Imã de Problemas | Problemas reais, frequentes e caros que atraem clientes dispostos a pagar. |
| `direcao/perfil-de-cliente-ideal` | Perfil de Cliente Ideal | Quem mais sente o problema escolhido e como essa pessoa decide comprar. |
| `direcao/tese-de-valor` | Tese de Valor | A hipótese central: por que este cliente escolheria você em vez das alternativas. |
| `direcao/oferta` | Oferta (desenho) | O que será vendido, para quem, por quanto e em quais condições. |
| `validacao/oferta` | Oferta (teste) | A oferta testada no mercado, o critério de sucesso e o que mudou a cada rodada. |
| `validacao/leads` | Leads | Mini CRM: empresas e contatos encontrados pelos agentes, do primeiro achado até a conversa. |
| `validacao/primeiros-clientes` | Primeiros Clientes | Os primeiros clientes e conversas de venda como evidência de validação. |
| `validacao/fluxo-de-caixa` | Fluxo de Caixa (orçamento do teste) | O caixa mínimo do período de teste: quanto gastar e quando parar. |
| `caixa/fluxo-de-caixa` | Fluxo de Caixa (operação) | A operação recorrente: entradas, saídas, saldo e projeção. |
| `caixa/erp` | ERP | A base operacional: sistemas, processos e controles para operar e faturar. |

Páginas com coleções de itens (campo `itens`, discriminados por `colecao`):

| Id | Coleções |
|---|---|
| `direcao/mapa-de-mercado` | `segmentos`, `concorrentes` |
| `direcao/ima-de-problemas` | `problemas` |
| `validacao/oferta` | `iteracoes` |
| `validacao/leads` | `leads` |
| `validacao/primeiros-clientes` | `clientes` |
| `validacao/fluxo-de-caixa` | `lancamentos` |
| `caixa/fluxo-de-caixa` | `lancamentos` |
| `caixa/erp` | `processos`, `ferramentas` |

As demais páginas têm só `campos`. A lista exata de campos, tipos e opções de cada página vem em `definicao` (veja abaixo).

## Como ler

O app roda em `http://127.0.0.1:3000` (`npm run dev`). Se `BUSINESSOS_API_TOKEN` estiver definido, todas as requisições (GET e PUT) precisam do header `Authorization: Bearer <token>`.

```bash
# Tudo, em Markdown pronto para colar em um prompt
curl -s "http://127.0.0.1:3000/api/context?format=md"

# Só alguns documentos (ids separados por vírgula)
curl -s "http://127.0.0.1:3000/api/context?ids=direcao/oferta,validacao/oferta&format=md"

# Só uma seção, em JSON, com as definições (schema) das páginas
curl -s "http://127.0.0.1:3000/api/context?secao=direcao&definicoes=1"

# Uma página: JSON com { documento, definicao }
curl -s http://127.0.0.1:3000/api/context/direcao/tese-de-valor

# Uma página: arquivo .md canônico (front matter + notas), útil para editar à mão
curl -s "http://127.0.0.1:3000/api/context/direcao/tese-de-valor?format=md"

# Com token
curl -s -H "Authorization: Bearer $BUSINESSOS_API_TOKEN" "http://127.0.0.1:3000/api/context?format=md"
```

- `?format=md` (padrão do consolidado é `json`), `?ids=a,b`, `?secao=x` e `?definicoes=1` (só JSON) se combinam; `secao` + `ids` = interseção.
- O Markdown consolidado mostra a data como "08/11/2026 às 11:32", não em ISO. Para usar `esperado_atualizado_em` leia o valor exato de `documento.atualizado_em` no JSON da página (ou do front matter em `?format=md` da página).
- Uma página ainda não salva responde 200 com o template vazio (`status: vazio`, `atualizado_em: 1970-01-01T00:00:00.000Z`).
- Sem a API: leia `content/<secao>/<pagina>.md`.

## Como escrever

`PUT /api/context/<secao>/<pagina>` com `Content-Type: application/json`. O PUT é uma atualização parcial com merge: o que você não enviar fica como está.

```bash
curl -X PUT http://127.0.0.1:3000/api/context/direcao/tese-de-valor \
  -H "Content-Type: application/json" \
  -d '{
    "atualizado_por": "agente:tese-de-valor",
    "esperado_atualizado_em": "2026-11-08T14:32:10.000Z",
    "campos": { "resultado_prometido": "Saber o lucro do mês em 5 minutos" },
    "corpo_anexar": "## Sugestão do tese-de-valor (08/11)\n- Testar a promessa ligada ao DAS."
  }'
```

Chaves aceitas no corpo (todas opcionais, mas envie ao menos uma além de `atualizado_por`):

| Chave | Efeito |
|---|---|
| `campos` | Merge por chave. `null` limpa o campo (não faça isso em campo preenchido). |
| `itens` | Upsert por `id`. Sem `id`, cria um item novo (informe sempre `colecao` e os campos obrigatórios). |
| `itens_remover` | Lista de ids de itens a remover. Só com pedido explícito. |
| `corpo` | Substitui as notas inteiras. Evite. |
| `corpo_anexar` | Acrescenta texto ao fim das notas. Prefira este. |
| `status`, `tags`, `relacionados` | Substituem o valor inteiro. |

Exemplo criando um item (cliente) em `validacao/primeiros-clientes`:

```bash
curl -X PUT http://127.0.0.1:3000/api/context/validacao/primeiros-clientes \
  -H "Content-Type: application/json" \
  -d '{
    "atualizado_por": "agente:tese-de-valor",
    "itens": [{ "colecao": "clientes", "nome": "Ana Souza", "status": "prospect" }]
  }'
```

- Campo obrigatório do corpo: `atualizado_por: "agente:<nome>"` (o nome é o do arquivo em `agents/<nome>.md`).
- Use `esperado_atualizado_em` (valor lido no GET) para não sobrescrever edições recentes. Em `409 CONFLITO` a resposta traz o documento atual: releia, refaça o patch em cima dele e envie de novo.
- Em `400 PAYLOAD_INVALIDO` leia `erro.detalhes` (caminho + mensagem) e corrija. Outros códigos: `401` (token), `403` (produção sem token), `404` (id inexistente), `413` (corpo > 256 KiB), `415` (faltou `Content-Type: application/json`), `422` (arquivo em disco inválido).
- Edição direta de arquivo: só se o app não estiver rodando. Mantenha a ordem das chaves do front matter, não mexa em `id`, `secao`, `pagina`, `titulo`, `descricao`, `estagio`, e rode `npm run content:validate` ao terminar.

## Regras (obrigatórias)

1. Respeite o schema da página (veja `definicao` no GET). Não invente chaves em `campos`.
2. Identifique-se: `atualizado_por: agente:<nome>` (igual ao nome em `agents/<nome>.md`).
3. Não apague conteúdo humano: nunca envie `null` nem `""` para um campo já preenchido, a menos que a fundadora peça. Prefira preencher campos vazios, criar itens novos e usar `corpo_anexar` com um título "## Sugestão do <nome> (dd/mm)".
4. Não altere itens existentes criados por humanos sem pedido explícito; não use `itens_remover` sem pedido explícito.
5. Escreva apenas nos ids listados em `escreve` do seu arquivo de agente.
6. Status: no máximo leve de `vazio` para `rascunho`; `em-validacao` e `validado` são decisão humana.
7. Escreva em português do Brasil; valores monetários em reais como número (`197.5`), datas `YYYY-MM-DD`.

## Workflow (o que você está fazendo)

A página `/workflow` mostra um Kanban com o que cada agente está fazendo. Registre sua tarefa ao começar e mova de coluna ao terminar (`fila` → `trabalhando` → `revisao` → `concluida`):

```bash
# Começar (sem id = cria; a resposta traz o id)
curl -X POST http://127.0.0.1:3000/api/workflow -H "Content-Type: application/json" \
  -d '{"agente":"perfil-de-cliente-ideal","titulo":"Descrever o cliente ideal","status":"trabalhando","docs":["direcao/perfil-de-cliente-ideal"]}'

# Atualizar (com id)
curl -X POST http://127.0.0.1:3000/api/workflow -H "Content-Type: application/json" \
  -d '{"id":"<id>","agente":"perfil-de-cliente-ideal","status":"revisao","nota":"Falta confirmar a faixa de preço"}'
```

- `agente` é o nome em `agents/<nome>.md`. `GET /api/workflow` lista tarefas e agentes. Mesmo token e mesmos códigos de erro da API de contexto.
- As tarefas ficam em `workflow/tarefas.json` (ou `BUSINESSOS_WORKFLOW_FILE`). Um agente só move as próprias tarefas.

## Agentes e skills

- `agents/<nome>.md`: front matter (`nome`, `papel`, `descricao`, `le`, `escreve`, `skills`) + instruções em português. Formato validado por `npm run content:validate` (spec §10.2).
- `skills/<nome>/SKILL.md`: formato padrão de skill (`name`, `description`) + instruções (spec §10.3).

| Agente | Papel | Lê | Escreve |
|---|---|---|---|
| `tese-de-valor` ([agents/tese-de-valor.md](agents/tese-de-valor.md)) | Estrategista de posicionamento | `founder/objetivo`, `direcao/mapa-de-mercado`, `direcao/ima-de-problemas`, `direcao/perfil-de-cliente-ideal`, `direcao/tese-de-valor` | `direcao/tese-de-valor` |
| `fluxo-de-caixa` ([agents/fluxo-de-caixa.md](agents/fluxo-de-caixa.md)) | Analista de caixa | `founder/estilo-de-vida`, `validacao/fluxo-de-caixa`, `caixa/fluxo-de-caixa`, `caixa/erp` | `validacao/fluxo-de-caixa`, `caixa/fluxo-de-caixa` |
| `resumo` ([agents/resumo.md](agents/resumo.md)) | Resumo do negócio: visão geral, contradições e próxima ação | as 12 páginas | nenhuma (só lê) |
| `founder` ([agents/founder.md](agents/founder.md)) | Mentora da fundadora | `founder/objetivo`, `founder/estilo-de-vida`, `caixa/fluxo-de-caixa` | `founder/objetivo`, `founder/estilo-de-vida` |
| `mapa-de-mercado` ([agents/mapa-de-mercado.md](agents/mapa-de-mercado.md)) | Mapeador de mercado | `founder/objetivo`, `founder/estilo-de-vida`, `direcao/mapa-de-mercado` | `direcao/mapa-de-mercado` |
| `ima-de-problemas` ([agents/ima-de-problemas.md](agents/ima-de-problemas.md)) | Caçador de problemas | `founder/objetivo`, `direcao/mapa-de-mercado`, `direcao/ima-de-problemas`, `direcao/perfil-de-cliente-ideal` | `direcao/ima-de-problemas` |
| `perfil-de-cliente-ideal` ([agents/perfil-de-cliente-ideal.md](agents/perfil-de-cliente-ideal.md)) | Especialista em cliente ideal | `founder/objetivo`, `direcao/mapa-de-mercado`, `direcao/ima-de-problemas`, `direcao/perfil-de-cliente-ideal` | `direcao/perfil-de-cliente-ideal` |
| `oferta` ([agents/oferta.md](agents/oferta.md)) | Desenhista de oferta | `founder/objetivo`, `founder/estilo-de-vida`, `direcao/perfil-de-cliente-ideal`, `direcao/tese-de-valor`, `direcao/oferta`, `validacao/oferta`, `validacao/fluxo-de-caixa` | `direcao/oferta` |
| `validacao` ([agents/validacao.md](agents/validacao.md)) | Validador (testes e primeiros clientes) | `direcao/tese-de-valor`, `direcao/oferta`, `validacao/oferta`, `validacao/primeiros-clientes`, `validacao/fluxo-de-caixa`, `founder/objetivo` | `validacao/oferta`, `validacao/primeiros-clientes` |
| `erp` ([agents/erp.md](agents/erp.md)) | Operações e ERP | `caixa/erp`, `caixa/fluxo-de-caixa`, `founder/estilo-de-vida`, `direcao/oferta` | `caixa/erp` |
| `revisor-de-contexto` ([agents/revisor-de-contexto.md](agents/revisor-de-contexto.md)) | Revisor de qualidade e coerência do contexto | as 12 páginas | nenhuma (só lê) |
| `assistente-de-arranque` ([agents/assistente-de-arranque.md](agents/assistente-de-arranque.md)) | Distribui um texto livre nos primeiros campos | `founder/*` e `direcao/*` (7 páginas) | as mesmas 7 páginas |

| Skill | Para que serve |
|---|---|
| `contexto-businessos` ([skills/contexto-businessos/SKILL.md](skills/contexto-businessos/SKILL.md)) | Ler e escrever o contexto do negócio pela API ou pelos arquivos. |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
