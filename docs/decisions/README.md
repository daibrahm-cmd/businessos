# Decisões de arquitetura (ADRs)

Cada decisão técnica que muda o rumo do BusinessOS vira um ADR (Architecture Decision Record): um arquivo curto que registra o que foi decidido, por quê e o que isso custa. Assim, daqui a seis meses, qualquer pessoa (ou agente) entende por que o código é como é.

## Índice

| Nº | Título | Status | Data |
|---|---|---|---|
| [0001](./0001-banco-de-dados-supabase-em-vez-de-markdown.md) | Banco de dados Supabase em vez de Markdown | Aceita | 2026-11-10 |

## Como escrever um ADR

1. Copie o ADR mais recente e use o próximo número com 4 dígitos: `NNNN-titulo-em-kebab-case.md`.
2. Use as seções, nesta ordem: **Status** (proposta, aceita, substituída por NNNN), **Data**, **Contexto**, **Decisão**, **Alternativas consideradas** (prós e contras em 1 linha cada), **Consequências** (positivas, negativas, riscos), **Plano de migração** (quando houver) e **Links**.
3. Seja curto: um ADR cabe em uma tela e meia. Explique o porquê, não o passo a passo de implementação (isso fica na spec).
4. Nunca reescreva um ADR aceito. Se a decisão mudar, crie um novo ADR e marque o antigo como "substituída por NNNN".
5. Atualize o índice acima e, se a decisão mudar contratos técnicos, a spec (`../03-spec.md`).
