// src/lib/content/schemas/paginas/direcao-ima-de-problemas.ts
// Definição da página Direção / Imã de Problemas.
import { definirPagina, OPCOES_FREQUENCIA, OPCOES_NIVEL } from "../definir-pagina";

export default definirPagina("direcao/ima-de-problemas", {
  relacionadosPadrao: ["direcao/mapa-de-mercado", "direcao/perfil-de-cliente-ideal"],
  placeholderNotas: "Cole aqui frases literais de clientes, links de posts e buscas que mostram o problema.",
  campos: [
    // ── O problema ───────────────────────────────────────────────────────────
    { nome: "problema_central", rotulo: "Problema central", tipo: "texto-longo", grupo: "O problema",
      ajuda: "O problema que você escolheu resolver primeiro." },
    { nome: "quem_sente", rotulo: "Quem sente mais", tipo: "texto-curto", grupo: "O problema",
      placeholder: "Ex.: MEI que mistura conta pessoal e da empresa" },
    { nome: "como_o_cliente_descreve", rotulo: "Como o cliente descreve o problema", tipo: "texto-longo", grupo: "O problema",
      ajuda: "Nas palavras dele, não nas suas. Frases literais." },
    { nome: "situacao_em_que_aparece", rotulo: "Em que momento ele aparece", tipo: "texto-longo", grupo: "O problema",
      ajuda: "A cena: onde a pessoa está e o que acontece quando o problema surge." },
    { nome: "o_que_ja_tentou", rotulo: "O que o cliente já tentou", tipo: "lista-texto", grupo: "O problema",
      ajuda: "Soluções que não funcionaram e por quê." },

    // ── Intensidade ──────────────────────────────────────────────────────────
    { nome: "custo_mensal_do_problema", rotulo: "Custo do problema por mês", tipo: "moeda", min: 0, grupo: "Intensidade",
      ajuda: "Quanto o problema custa ao cliente (dinheiro perdido, multas, tempo)." },
    { nome: "frequencia", rotulo: "Frequência", tipo: "selecao", opcoes: OPCOES_FREQUENCIA, grupo: "Intensidade",
      ajuda: "Com que frequência o problema aparece." },
    { nome: "urgencia", rotulo: "Urgência", tipo: "selecao", opcoes: OPCOES_NIVEL, grupo: "Intensidade",
      ajuda: "O quanto o cliente quer resolver já, e não \"um dia\"." },
    { nome: "consequencia_de_nao_resolver", rotulo: "O que acontece se não resolver", tipo: "texto-longo", grupo: "Intensidade" },
    { nome: "ja_paga_para_resolver", rotulo: "Já paga para resolver?", tipo: "selecao", grupo: "Intensidade", opcoes: [
      { valor: "sim", rotulo: "Sim" },
      { valor: "tenta-de-graca", rotulo: "Só tenta de graça" },
      { valor: "nao", rotulo: "Não" },
    ] },

    // ── Evidências e solução ─────────────────────────────────────────────────
    { nome: "evidencias", rotulo: "Evidências", tipo: "lista-texto", grupo: "Evidências e solução",
      ajuda: "Frases reais, posts, buscas, reclamações." },
    { nome: "pessoas_ouvidas", rotulo: "Quantas pessoas você ouviu", tipo: "numero", inteiro: true, min: 0, unidade: "pessoas",
      grupo: "Evidências e solução" },
    { nome: "hipotese_de_solucao", rotulo: "Hipótese de solução", tipo: "texto-longo", grupo: "Evidências e solução",
      ajuda: "Como você acha que resolve." },
    { nome: "por_que_voce_resolve", rotulo: "Por que você é a pessoa certa", tipo: "texto-longo", grupo: "Evidências e solução",
      ajuda: "Sua ligação pessoal ou profissional com este problema." },
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
