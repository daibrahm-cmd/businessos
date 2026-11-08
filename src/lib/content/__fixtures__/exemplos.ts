// src/lib/content/__fixtures__/exemplos.ts
// Os dois arquivos de exemplo da spec (§3.8), usados nos testes da camada de conteúdo.

export const EXEMPLO_PERFIL = `---
id: direcao/perfil-de-cliente-ideal
secao: direcao
pagina: perfil-de-cliente-ideal
titulo: Perfil de Cliente Ideal
descricao: Quem mais sente o problema escolhido e como essa pessoa decide comprar.
estagio: para-quem-esta-comecando
status: rascunho
atualizado_em: '2026-11-08T14:32:10.000Z'
atualizado_por: humano
tags:
  - mei
  - servicos
relacionados:
  - direcao/ima-de-problemas
  - direcao/tese-de-valor
campos:
  quem_e: >-
    Carla, 34 anos, manicure MEI em Curitiba. Atende 6 clientes por dia,
    recebe tudo no Pix pessoal e no fim do mês não sabe se teve lucro.
  dados_demograficos:
    - 28 a 45 anos
    - MEI prestadora de serviço (beleza e bem-estar)
    - Fatura de R$ 4 mil a R$ 8 mil por mês
    - Capitais e regiões metropolitanas do Sul e Sudeste
  dores:
    - Mistura conta pessoal e da empresa
    - Não sabe quanto pode retirar por mês
    - Medo de cair na malha fina ou estourar o limite do MEI
  desejos:
    - Saber quanto lucrou no mês em 5 minutos
    - Pagar o DAS em dia sem lembrar disso
  onde_esta:
    - Instagram (perfis de gestão para salões)
    - Grupos de WhatsApp de profissionais da beleza
    - Feiras do setor
  gatilhos_de_compra:
    - Mês em que faltou dinheiro para pagar um fornecedor
    - Aviso de DAS atrasado
  objecoes:
    - Não tenho tempo para planilha
    - Meu contador já resolve isso
  quanto_paga_hoje: 89
itens: []
---

## Notas

- Entrevistei 4 manicures; 3 usam o Pix pessoal para tudo.
- Hipótese: o gatilho mais forte é o **DAS atrasado**, não o desejo de lucro.
`;

export const EXEMPLO_CLIENTES = `---
id: validacao/primeiros-clientes
secao: validacao
pagina: primeiros-clientes
titulo: Primeiros Clientes
descricao: Os primeiros clientes e conversas de venda como evidência de validação.
estagio: para-quem-esta-comecando
status: em-validacao
atualizado_em: '2026-11-08T18:05:44.120Z'
atualizado_por: agente:estrategista
tags: []
relacionados:
  - direcao/perfil-de-cliente-ideal
  - validacao/oferta
campos:
  meta_de_clientes: 5
  prazo_da_meta: '2026-12-15'
  roteiro_de_abordagem: >-
    Mensagem no WhatsApp perguntando como ela controla o dinheiro do salão;
    se responder com dor, ofereço uma conversa de 20 minutos.
  principais_aprendizados:
    - Quem tem DAS atrasado fecha mais rápido
  objecoes_recorrentes:
    - Já tenho contador
itens:
  - id: a1b2c3d4e5
    colecao: clientes
    nome: Ana Souza
    contato: '@ana.nails'
    origem: instagram
    status: fechado
    valor: 197
    proximo_passo: Onboarding na segunda
    aprendizado: Fechou depois de ver o próprio DRE simplificado na call.
  - id: f6e7d8c9b0
    colecao: clientes
    nome: Bruna Lima
    contato: (41) 99999-0000
    origem: indicacao
    status: proposta
    valor: 197
    proximo_passo: Retornar na sexta
    aprendizado: ''
  - id: 0c9d8e7f6a
    colecao: clientes
    nome: Salão Bela Vida
    contato: ''
    origem: evento
    status: perdido
    valor: null
    proximo_passo: ''
    aprendizado: Achou caro porque já paga contador; objeção de preço disfarçada.
---

## Notas

Duas das três conversas começaram por indicação ou Instagram. Repetir o canal Instagram na próxima rodada.
`;
