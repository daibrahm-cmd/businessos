// src/lib/content/schemas/paginas/direcao-mapa-de-mercado.ts
// Definição da página Direção / Mapa de Mercado.
import { definirPagina, OPCOES_NIVEL } from "../definir-pagina";

export default definirPagina("direcao/mapa-de-mercado", {
  relacionadosPadrao: ["direcao/ima-de-problemas", "direcao/perfil-de-cliente-ideal"],
  placeholderNotas: "Anote fontes, números de mercado e observações sobre concorrentes.",
  campos: [
    // ── Recorte do mercado ───────────────────────────────────────────────────
    { nome: "mercado", rotulo: "Mercado", tipo: "texto-curto", grupo: "Recorte do mercado",
      placeholder: "Ex.: organização financeira para MEIs prestadores de serviço" },
    { nome: "regiao", rotulo: "Região de atuação", tipo: "texto-curto", grupo: "Recorte do mercado", placeholder: "Ex.: Brasil, online" },
    // Porte das empresas-alvo: separa a faixa principal da secundária para não misturar recortes.
    { nome: "porte_alvo", rotulo: "Porte das empresas-alvo", tipo: "texto-curto", grupo: "Recorte do mercado",
      ajuda: "Faixa de funcionários (ou faturamento) das empresas que você quer atender, separando principal e secundária.",
      placeholder: "Ex.: principal: 100 a 500 funcionários; secundária: 30 a 99" },
    { nome: "por_que_este_mercado", rotulo: "Por que este mercado", tipo: "texto-longo", grupo: "Recorte do mercado",
      ajuda: "O que te conecta a ele: experiência, rede de contatos, acesso, interesse." },
    { nome: "conhecimento_do_mercado", rotulo: "O quanto você conhece este mercado", tipo: "selecao", grupo: "Recorte do mercado",
      opcoes: OPCOES_NIVEL },
    { nome: "rede_de_contatos", rotulo: "Quem você já conhece nele", tipo: "lista-texto", grupo: "Recorte do mercado",
      ajuda: "Pessoas ou comunidades que podem te dar acesso a clientes (um por linha)." },

    // ── Tamanho e dinheiro ───────────────────────────────────────────────────
    { nome: "tamanho_estimado", rotulo: "Tamanho estimado", tipo: "numero", inteiro: true, min: 0, unidade: "clientes", grupo: "Tamanho e dinheiro",
      ajuda: "Quantos clientes potenciais existem no recorte escolhido." },
    { nome: "fonte_do_tamanho", rotulo: "De onde veio esse número", tipo: "texto-curto", grupo: "Tamanho e dinheiro",
      placeholder: "Ex.: IBGE, Sebrae, LinkedIn Sales Navigator, chute" },
    { nome: "ticket_medio_mercado", rotulo: "Ticket médio do mercado", tipo: "moeda", min: 0, grupo: "Tamanho e dinheiro",
      ajuda: "Quanto se paga, em média, por soluções parecidas." },
    { nome: "clientes_necessarios", rotulo: "Clientes necessários para a meta", tipo: "numero", inteiro: true, min: 0, unidade: "clientes",
      grupo: "Tamanho e dinheiro", ajuda: "Quantos você precisa fechar para bater a renda desejada." },

    // ── Dinâmica ─────────────────────────────────────────────────────────────
    { nome: "tendencias", rotulo: "Tendências", tipo: "lista-texto", grupo: "Dinâmica do mercado",
      ajuda: "Mudanças que favorecem ou ameaçam o mercado." },
    { nome: "regulacao_e_barreiras", rotulo: "Regras e barreiras de entrada", tipo: "lista-texto", grupo: "Dinâmica do mercado",
      ajuda: "Licenças, regulação, investimento inicial, exigências de confiança." },
    { nome: "sazonalidade", rotulo: "Sazonalidade", tipo: "texto-curto", grupo: "Dinâmica do mercado",
      placeholder: "Ex.: vende mais em janeiro e no fim do ano" },
    { nome: "alternativas_atuais", rotulo: "Como o cliente resolve hoje", tipo: "lista-texto", grupo: "Dinâmica do mercado",
      ajuda: "Planilha, contador, app, \"não resolve\"…" },
    { nome: "espaco_livre", rotulo: "Espaço livre", tipo: "texto-longo", grupo: "Dinâmica do mercado",
      ajuda: "A lacuna que ninguém atende bem e que você pode ocupar." },
    { nome: "riscos_do_mercado", rotulo: "Riscos do mercado", tipo: "lista-texto", grupo: "Dinâmica do mercado",
      ajuda: "O que pode fazer este mercado desaparecer ou encolher." },
  ],
  colecoes: [
    {
      nome: "segmentos", rotulo: "Segmentos", rotuloItem: "Segmento",
      campoTitulo: "nome", campoSubtitulo: "descricao", campoDestaque: "atratividade",
      campos: [
        { nome: "nome", rotulo: "Nome", tipo: "texto-curto", obrigatorio: true, placeholder: "Ex.: MEIs de beleza" },
        { nome: "descricao", rotulo: "Descrição", tipo: "texto-longo", ajuda: "Quem está neste segmento." },
        { nome: "tamanho", rotulo: "Tamanho", tipo: "numero", inteiro: true, min: 0, unidade: "clientes" },
        { nome: "atratividade", rotulo: "Atratividade", tipo: "selecao", opcoes: OPCOES_NIVEL,
          ajuda: "Quanto vale a pena atender." },
        { nome: "acesso", rotulo: "Facilidade de acesso", tipo: "selecao", opcoes: [
          { valor: "facil", rotulo: "Fácil" },
          { valor: "medio", rotulo: "Médio" },
          { valor: "dificil", rotulo: "Difícil" },
        ], ajuda: "Quão fácil é chegar até eles." },
      ],
      resumos: [{ tipo: "contagem", rotulo: "Segmentos mapeados" }],
    },
    {
      nome: "concorrentes", rotulo: "Concorrentes", rotuloItem: "Concorrente",
      campoTitulo: "nome", campoSubtitulo: "link", campoDestaque: "tipo",
      campos: [
        { nome: "nome", rotulo: "Nome", tipo: "texto-curto", obrigatorio: true },
        { nome: "tipo", rotulo: "Tipo", tipo: "selecao", opcoes: [
          { valor: "direto", rotulo: "Direto" },
          { valor: "indireto", rotulo: "Indireto" },
          { valor: "substituto", rotulo: "Substituto" },
        ] },
        { nome: "preco", rotulo: "Preço", tipo: "moeda", min: 0, ajuda: "Preço principal que cobram." },
        { nome: "pontos_fortes", rotulo: "Pontos fortes", tipo: "lista-texto" },
        { nome: "pontos_fracos", rotulo: "Pontos fracos", tipo: "lista-texto" },
        { nome: "link", rotulo: "Link", tipo: "texto-curto", placeholder: "https://…" },
      ],
    },
  ],
});
