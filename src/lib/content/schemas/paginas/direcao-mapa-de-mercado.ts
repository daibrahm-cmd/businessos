// src/lib/content/schemas/paginas/direcao-mapa-de-mercado.ts
// Definição da página Direção / Mapa de Mercado.
import { definirPagina, OPCOES_NIVEL } from "../definir-pagina";

export default definirPagina("direcao/mapa-de-mercado", {
  relacionadosPadrao: ["direcao/ima-de-problemas", "direcao/perfil-de-cliente-ideal"],
  placeholderNotas: "Anote fontes, números de mercado e observações sobre concorrentes.",
  campos: [
    { nome: "mercado", rotulo: "Mercado", tipo: "texto-curto",
      placeholder: "Ex.: organização financeira para MEIs prestadores de serviço" },
    { nome: "regiao", rotulo: "Região de atuação", tipo: "texto-curto", placeholder: "Ex.: Brasil, online" },
    { nome: "tamanho_estimado", rotulo: "Tamanho estimado", tipo: "numero", inteiro: true, min: 0, unidade: "clientes",
      ajuda: "Quantos clientes potenciais existem no recorte escolhido." },
    { nome: "ticket_medio_mercado", rotulo: "Ticket médio do mercado", tipo: "moeda", min: 0,
      ajuda: "Quanto se paga, em média, por soluções parecidas." },
    { nome: "tendencias", rotulo: "Tendências", tipo: "lista-texto",
      ajuda: "Mudanças que favorecem ou ameaçam o mercado." },
    { nome: "alternativas_atuais", rotulo: "Como o cliente resolve hoje", tipo: "lista-texto",
      ajuda: "Planilha, contador, app, \"não resolve\"…" },
    { nome: "espaco_livre", rotulo: "Espaço livre", tipo: "texto-longo",
      ajuda: "A lacuna que ninguém atende bem e que você pode ocupar." },
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
