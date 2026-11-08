// src/lib/content/schemas/paginas/direcao-ima-de-problemas.ts
// Definição da página Direção / Imã de Problemas.
import { definirPagina, OPCOES_FREQUENCIA } from "../definir-pagina";

export default definirPagina("direcao/ima-de-problemas", {
  relacionadosPadrao: ["direcao/mapa-de-mercado", "direcao/perfil-de-cliente-ideal"],
  placeholderNotas: "Cole aqui frases literais de clientes, links de posts e buscas que mostram o problema.",
  campos: [
    { nome: "problema_central", rotulo: "Problema central", tipo: "texto-longo",
      ajuda: "O problema que você escolheu resolver primeiro." },
    { nome: "quem_sente", rotulo: "Quem sente mais", tipo: "texto-curto",
      placeholder: "Ex.: MEI que mistura conta pessoal e da empresa" },
    { nome: "custo_mensal_do_problema", rotulo: "Custo do problema por mês", tipo: "moeda", min: 0,
      ajuda: "Quanto o problema custa ao cliente (dinheiro perdido, multas, tempo)." },
    { nome: "frequencia", rotulo: "Frequência", tipo: "selecao", opcoes: OPCOES_FREQUENCIA,
      ajuda: "Com que frequência o problema aparece." },
    { nome: "evidencias", rotulo: "Evidências", tipo: "lista-texto",
      ajuda: "Frases reais, posts, buscas, reclamações." },
    { nome: "hipotese_de_solucao", rotulo: "Hipótese de solução", tipo: "texto-longo",
      ajuda: "Como você acha que resolve." },
  ],
  colecoes: [
    {
      nome: "problemas", rotulo: "Problemas", rotuloItem: "Problema",
      campoTitulo: "descricao", campoSubtitulo: "fonte", campoDestaque: "situacao",
      campos: [
        { nome: "descricao", rotulo: "Problema", tipo: "texto-curto", obrigatorio: true,
          placeholder: "Ex.: Não sabe quanto pode retirar por mês" },
        { nome: "intensidade", rotulo: "Intensidade", tipo: "selecao", opcoes: [
          { valor: "baixa", rotulo: "Baixa" },
          { valor: "media", rotulo: "Média" },
          { valor: "alta", rotulo: "Alta" },
          { valor: "critica", rotulo: "Crítica" },
        ], ajuda: "Quanto dói." },
        { nome: "frequencia", rotulo: "Frequência", tipo: "selecao", opcoes: OPCOES_FREQUENCIA },
        { nome: "disposicao_a_pagar", rotulo: "Disposição a pagar", tipo: "selecao", opcoes: [
          { valor: "nenhuma", rotulo: "Nenhuma" },
          { valor: "baixa", rotulo: "Baixa" },
          { valor: "media", rotulo: "Média" },
          { valor: "alta", rotulo: "Alta" },
        ] },
        { nome: "situacao", rotulo: "Situação", tipo: "selecao", opcoes: [
          { valor: "hipotese", rotulo: "Hipótese" },
          { valor: "confirmado", rotulo: "Confirmado" },
          { valor: "descartado", rotulo: "Descartado" },
        ] },
        { nome: "fonte", rotulo: "Fonte", tipo: "texto-curto", ajuda: "Onde você ouviu ou viu isso." },
        { nome: "evidencia", rotulo: "Evidência", tipo: "texto-longo", ajuda: "Citação literal, de preferência." },
      ],
      resumos: [
        { tipo: "contagem", rotulo: "Problemas confirmados", filtro: { campo: "situacao", valor: "confirmado" } },
      ],
    },
  ],
});
