---
name: contexto-businessos
description: Lê e escreve o contexto do negócio no BusinessOS (API /api/context ou arquivos content/). Use sempre que precisar consultar ou atualizar páginas como Objetivo, Perfil de Cliente Ideal, Oferta ou Fluxo de Caixa.
---

# Contexto BusinessOS

O contexto do negócio vive em 12 páginas (`content/<secao>/<pagina>.md`), expostas pela API local em `http://127.0.0.1:3000`. Ids: `founder/objetivo`, `founder/estilo-de-vida`, `direcao/mapa-de-mercado`, `direcao/ima-de-problemas`, `direcao/perfil-de-cliente-ideal`, `direcao/tese-de-valor`, `direcao/oferta`, `validacao/oferta`, `validacao/primeiros-clientes`, `validacao/fluxo-de-caixa`, `caixa/fluxo-de-caixa`, `caixa/erp`. Se `BUSINESSOS_API_TOKEN` estiver definido, acrescente `-H "Authorization: Bearer $BUSINESSOS_API_TOKEN"` a toda chamada.

## Ler

- Tudo, pronto para prompt: `curl -s "http://127.0.0.1:3000/api/context?format=md"`
- Só alguns documentos: `curl -s "http://127.0.0.1:3000/api/context?ids=direcao/oferta,validacao/oferta&format=md"`
- Uma seção: `curl -s "http://127.0.0.1:3000/api/context?secao=direcao&format=md"`
- Em JSON, com os schemas: `curl -s "http://127.0.0.1:3000/api/context?ids=direcao/oferta&definicoes=1"`
- Uma página com o schema: `curl -s http://127.0.0.1:3000/api/context/direcao/oferta` devolve `{ "documento": ..., "definicao": ... }`
- A página como arquivo `.md` bruto: `curl -s "http://127.0.0.1:3000/api/context/direcao/oferta?format=md"`
- Sem o app rodando: ler `content/<secao>/<pagina>.md`.

O Markdown consolidado mostra datas formatadas ("08/11/2026 às 11:32"). Para o `esperado_atualizado_em` use o ISO exato de `documento.atualizado_em` (JSON da página).

## Escrever

1. Faça GET JSON da página e guarde `documento.atualizado_em` (página nunca salva vem com `1970-01-01T00:00:00.000Z`) e a `definicao` (nomes de campos, tipos, opções, obrigatórios).
2. Monte um JSON só com o que muda: `campos`, `itens` (novos, sempre com `colecao`), `corpo_anexar`.
3. Envie:

```bash
curl -X PUT http://127.0.0.1:3000/api/context/direcao/oferta \
  -H "Content-Type: application/json" \
  -d '{
    "atualizado_por": "agente:<seu-nome>",
    "esperado_atualizado_em": "2026-11-08T14:32:10.000Z",
    "campos": { "nome_da_oferta": "Caixa em Dia", "preco": 197.5, "formato": "assinatura" },
    "corpo_anexar": "## Sugestão do <seu-nome> (08/11)\n- Testar garantia de 7 dias."
  }'
```

4. Resposta 200: `{ "documento": ... }` com o documento gravado. O PUT faz merge: o que você não enviar fica como está.
5. Erros: `409 CONFLITO` (alguém salvou antes; a resposta traz o documento atual: releia e refaça), `400 PAYLOAD_INVALIDO` (leia `erro.detalhes`: caminho + mensagem), `401/403` (token), `404` (id fora da lista), `415` (faltou `Content-Type: application/json`), `422` (arquivo em disco inválido: avise a fundadora, não tente sobrescrever).

Itens de coleção (ex.: `clientes`, `lancamentos`, `problemas`):

```bash
curl -X PUT http://127.0.0.1:3000/api/context/validacao/primeiros-clientes \
  -H "Content-Type: application/json" \
  -d '{
    "atualizado_por": "agente:<seu-nome>",
    "itens": [{ "colecao": "clientes", "nome": "Ana Souza", "status": "prospect", "valor": 197 }]
  }'
```

Item sem `id` é criado no fim; item com `id` existente é atualizado por merge (não faça sem pedido); `itens_remover` só com pedido explícito.

## Tipos de valor

- texto-curto, texto-longo: string (`""` = vazio).
- numero, moeda: número (reais, ex.: `197.5`), nunca string formatada ("R$ 197,50").
- lista-texto: array de strings, um por item.
- selecao: exatamente um `opcoes[].valor` da definição (ex.: `fechado`, `hipotese`), não o rótulo.
- data: `"YYYY-MM-DD"`.
- Limpar um campo: `null`. Não faça em campo preenchido sem pedido da fundadora.
- Itens: `colecao` obrigatório e os campos marcados como obrigatórios na definição (ex.: `nome` e `status` em `clientes`).

## Regras

Siga o `AGENTS.md`: não apagar conteúdo humano, identificar-se com `atualizado_por: agente:<nome>`, escrever só nos ids permitidos no seu `agents/<nome>.md`, status no máximo `rascunho`, tudo em português do Brasil.
