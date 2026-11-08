// src/lib/content/schemas/paginas/founder-objetivo.ts
// Definição da página Founder / Objetivo.
import { definirPagina, OPCOES_NIVEL } from "../definir-pagina";

export default definirPagina("founder/objetivo", {
  relacionadosPadrao: ["founder/estilo-de-vida", "direcao/tese-de-valor"],
  placeholderNotas: "Anote aqui o contexto pessoal por trás do objetivo: medos, apostas e o que mudaria sua decisão.",
  campos: [
    // ── Visão ────────────────────────────────────────────────────────────────
    { nome: "objetivo_principal", rotulo: "Objetivo principal", tipo: "texto-longo", grupo: "Visão",
      ajuda: "Em uma ou duas frases: o que você quer que este negócio realize.",
      placeholder: "Ex.: Ter uma consultoria que me pague R$ 12 mil/mês trabalhando 30 h por semana." },
    { nome: "tipo_de_objetivo", rotulo: "Que tipo de negócio você quer", tipo: "selecao", grupo: "Visão",
      ajuda: "Escolha o que mais se aproxima.", opcoes: [
        { valor: "renda-extra", rotulo: "Renda extra" },
        { valor: "substituir-salario", rotulo: "Substituir meu salário" },
        { valor: "empresa-escalavel", rotulo: "Empresa que escala" },
        { valor: "autonomia", rotulo: "Autonomia e liberdade" },
        { valor: "impacto", rotulo: "Impacto / propósito" },
      ] },
    { nome: "visao_de_3_anos", rotulo: "Onde você quer estar em 3 anos", tipo: "texto-longo", grupo: "Visão",
      ajuda: "Descreva um dia comum daqui a 3 anos, se tudo der certo." },
    { nome: "o_que_voce_nao_quer", rotulo: "O que você não quer virar", tipo: "texto-longo", grupo: "Visão",
      ajuda: "O oposto do sonho: o cenário que seria um fracasso para você, mesmo dando dinheiro." },

    // ── Motivação ────────────────────────────────────────────────────────────
    { nome: "por_que_agora", rotulo: "Por que agora", tipo: "texto-longo", grupo: "Motivação",
      ajuda: "O que fez você começar agora e não daqui a um ano." },
    { nome: "historia_pessoal", rotulo: "O que te trouxe até aqui", tipo: "texto-longo", grupo: "Motivação",
      ajuda: "Experiências, trabalhos e momentos que levaram a esta ideia." },
    { nome: "o_que_te_move", rotulo: "O que te move de verdade", tipo: "lista-texto", grupo: "Motivação",
      ajuda: "Dinheiro, liberdade, reconhecimento, ajudar pessoas… seja honesta (um por linha)." },
    { nome: "quem_depende_de_voce", rotulo: "Quem é afetado pela sua decisão", tipo: "texto-curto", grupo: "Motivação",
      placeholder: "Ex.: parceiro(a), 2 filhos, sócia" },
    { nome: "compromisso", rotulo: "Nível de compromisso", tipo: "selecao", grupo: "Motivação",
      ajuda: "O quanto você está disposta a abrir mão por isso hoje.", opcoes: OPCOES_NIVEL },

    // ── Metas e números ──────────────────────────────────────────────────────
    { nome: "meta_12_meses", rotulo: "Meta para 12 meses", tipo: "texto-curto", grupo: "Metas e números",
      ajuda: "Um resultado mensurável.", placeholder: "Ex.: 25 clientes recorrentes" },
    { nome: "renda_minima_mensal", rotulo: "Renda mínima que você precisa", tipo: "moeda", min: 0, grupo: "Metas e números",
      ajuda: "Quanto o negócio precisa te pagar por mês para valer a pena." },
    { nome: "renda_desejada_mensal", rotulo: "Renda que você quer", tipo: "moeda", min: 0, grupo: "Metas e números",
      ajuda: "O número que te deixaria realizada." },
    { nome: "faturamento_necessario", rotulo: "Faturamento mensal necessário", tipo: "moeda", min: 0, grupo: "Metas e números",
      ajuda: "Considerando impostos e custos, quanto precisa entrar para chegar na renda desejada." },
    { nome: "prazo_para_primeira_venda", rotulo: "Prazo para a primeira venda", tipo: "numero", inteiro: true, min: 0,
      unidade: "dias", grupo: "Metas e números", ajuda: "Em quantos dias você quer ter o primeiro cliente pagante." },
    { nome: "criterios_de_sucesso", rotulo: "Critérios de sucesso", tipo: "lista-texto", grupo: "Metas e números",
      ajuda: "Sinais objetivos de que está dando certo (um por linha)." },

    // ── Decisão, riscos e limites ────────────────────────────────────────────
    { nome: "data_de_decisao", rotulo: "Data de decisão", tipo: "data", grupo: "Decisão e limites",
      ajuda: "Até quando você avalia se continua, ajusta ou para." },
    { nome: "criterio_para_parar", rotulo: "O que te faria parar", tipo: "texto-longo", grupo: "Decisão e limites",
      ajuda: "Resultado ou situação que, se acontecer, você encerra ou muda de rumo." },
    { nome: "maiores_medos", rotulo: "Maiores medos", tipo: "lista-texto", grupo: "Decisão e limites",
      ajuda: "O que mais te preocupa nesta jornada." },
    { nome: "maior_risco", rotulo: "Maior risco do negócio", tipo: "texto-curto", grupo: "Decisão e limites",
      placeholder: "Ex.: não conseguir clientes antes do dinheiro acabar" },
    { nome: "limites_inegociaveis", rotulo: "Limites inegociáveis", tipo: "lista-texto", grupo: "Decisão e limites",
      ajuda: "O que você não aceita fazer para atingir o objetivo." },
  ],
});
