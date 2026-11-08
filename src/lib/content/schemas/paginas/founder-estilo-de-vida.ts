// src/lib/content/schemas/paginas/founder-estilo-de-vida.ts
// Definição da página Founder / Estilo de Vida.
import { definirPagina, OPCOES_NIVEL } from "../definir-pagina";

export default definirPagina("founder/estilo-de-vida", {
  relacionadosPadrao: ["founder/objetivo", "caixa/fluxo-de-caixa"],
  placeholderNotas: "Registre combinados com a família, fases da vida e qualquer restrição que o negócio precisa respeitar.",
  campos: [
    // ── Tempo ────────────────────────────────────────────────────────────────
    { nome: "horas_por_semana", rotulo: "Horas por semana", tipo: "numero", inteiro: true, min: 0, max: 168, unidade: "h",
      grupo: "Tempo", ajuda: "Tempo real que você pode dedicar ao negócio.", placeholder: "Ex.: 25" },
    { nome: "dedicacao", rotulo: "Dedicação", tipo: "selecao", grupo: "Tempo", opcoes: [
      { valor: "integral", rotulo: "Tempo integral" },
      { valor: "parcial", rotulo: "Tempo parcial" },
      { valor: "paralela", rotulo: "Em paralelo a um emprego" },
    ] },
    { nome: "melhores_horarios", rotulo: "Seus melhores horários", tipo: "texto-curto", grupo: "Tempo",
      placeholder: "Ex.: manhãs de segunda a sexta, sábado até meio-dia" },
    { nome: "rotina_ideal", rotulo: "Rotina ideal", tipo: "texto-longo", grupo: "Tempo",
      ajuda: "Como é uma semana boa de trabalho para você." },
    { nome: "viagens_e_ausencias", rotulo: "Viagens e períodos fora", tipo: "texto-curto", grupo: "Tempo",
      placeholder: "Ex.: 3 semanas de férias por ano, viagem em julho" },

    // ── Dinheiro pessoal ─────────────────────────────────────────────────────
    { nome: "retirada_desejada", rotulo: "Retirada mensal desejada", tipo: "moeda", min: 0, grupo: "Dinheiro pessoal",
      ajuda: "Quanto você quer tirar do negócio por mês quando ele estiver de pé." },
    { nome: "custo_de_vida_mensal", rotulo: "Custo de vida mensal", tipo: "moeda", min: 0, grupo: "Dinheiro pessoal",
      ajuda: "Quanto você gasta por mês para viver hoje." },
    { nome: "folego_em_meses", rotulo: "Fôlego financeiro", tipo: "numero", min: 0, unidade: "meses", grupo: "Dinheiro pessoal",
      ajuda: "Quantos meses você se sustenta sem renda do negócio." },
    { nome: "valor_para_investir", rotulo: "Quanto pode investir", tipo: "moeda", min: 0, grupo: "Dinheiro pessoal",
      ajuda: "Dinheiro que você aceita perder para testar a ideia." },
    { nome: "outras_fontes_de_renda", rotulo: "Outras fontes de renda", tipo: "texto-curto", grupo: "Dinheiro pessoal",
      placeholder: "Ex.: salário do emprego atual, aluguel, renda do parceiro" },
    { nome: "dividas", rotulo: "Dívidas e compromissos fixos", tipo: "texto-curto", grupo: "Dinheiro pessoal",
      placeholder: "Ex.: financiamento de R$ 1.800/mês" },

    // ── Jeito de trabalhar ───────────────────────────────────────────────────
    { nome: "modelo_de_trabalho", rotulo: "Modelo de trabalho", tipo: "selecao", grupo: "Jeito de trabalhar", opcoes: [
      { valor: "remoto", rotulo: "Remoto" },
      { valor: "presencial", rotulo: "Presencial" },
      { valor: "hibrido", rotulo: "Híbrido" },
    ] },
    { nome: "trabalha_sozinha", rotulo: "Trabalha sozinha ou com sócios", tipo: "selecao", grupo: "Jeito de trabalhar", opcoes: [
      { valor: "sozinha", rotulo: "Sozinha" },
      { valor: "com-socio", rotulo: "Com sócio(a)" },
      { valor: "com-equipe", rotulo: "Com equipe" },
    ] },
    { nome: "conforto_com_vendas", rotulo: "Conforto com vender", tipo: "selecao", grupo: "Jeito de trabalhar",
      ajuda: "O quanto você gosta de abordar e fechar com clientes.", opcoes: OPCOES_NIVEL },
    { nome: "conforto_com_aparecer", rotulo: "Conforto com aparecer", tipo: "selecao", grupo: "Jeito de trabalhar",
      ajuda: "Gravar vídeos, postar, falar em público.", opcoes: OPCOES_NIVEL },
    { nome: "energia_gera", rotulo: "O que te dá energia", tipo: "lista-texto", grupo: "Jeito de trabalhar",
      ajuda: "Tipos de tarefa que você faria o dia todo." },
    { nome: "energia_drena", rotulo: "O que te drena", tipo: "lista-texto", grupo: "Jeito de trabalhar",
      ajuda: "Tarefas que você adiaria ou delegaria (a Imã de Problemas e a Oferta devem evitá-las)." },

    // ── Pessoal e inegociáveis ───────────────────────────────────────────────
    { nome: "apoio_de_quem_convive", rotulo: "Apoio de quem convive com você", tipo: "selecao", grupo: "Vida pessoal",
      opcoes: [
        { valor: "total", rotulo: "Total" },
        { valor: "parcial", rotulo: "Parcial" },
        { valor: "nenhum", rotulo: "Nenhum ainda" },
      ] },
    { nome: "saude_e_energia", rotulo: "Saúde e energia", tipo: "texto-curto", grupo: "Vida pessoal",
      ajuda: "Algo que limita sua carga de trabalho?", placeholder: "Ex.: preciso dormir 8h; enxaqueca com tela à noite" },
    { nome: "inegociaveis_pessoais", rotulo: "Inegociáveis da vida pessoal", tipo: "lista-texto", grupo: "Vida pessoal",
      placeholder: "Ex.: buscar as crianças na escola às 17h" },
  ],
});
