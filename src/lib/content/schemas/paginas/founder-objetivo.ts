// src/lib/content/schemas/paginas/founder-objetivo.ts
// Definição da página Founder / Objetivo.
import { definirPagina } from "../definir-pagina";

export default definirPagina("founder/objetivo", {
  relacionadosPadrao: ["founder/estilo-de-vida", "direcao/tese-de-valor"],
  placeholderNotas: "Anote aqui o contexto pessoal por trás do objetivo: medos, apostas e o que mudaria sua decisão.",
  campos: [
    { nome: "objetivo_principal", rotulo: "Objetivo principal", tipo: "texto-longo",
      ajuda: "Em uma ou duas frases: o que você quer que este negócio realize.",
      placeholder: "Ex.: Ter uma consultoria que me pague R$ 12 mil/mês trabalhando 30 h por semana." },
    { nome: "por_que_agora", rotulo: "Por que agora", tipo: "texto-longo",
      ajuda: "O que fez você começar agora e não daqui a um ano." },
    { nome: "meta_12_meses", rotulo: "Meta para 12 meses", tipo: "texto-curto",
      ajuda: "Um resultado mensurável.", placeholder: "Ex.: 25 clientes recorrentes" },
    { nome: "renda_minima_mensal", rotulo: "Renda mínima que você precisa", tipo: "moeda", min: 0,
      ajuda: "Quanto o negócio precisa te pagar por mês para valer a pena." },
    { nome: "data_de_decisao", rotulo: "Data de decisão", tipo: "data",
      ajuda: "Até quando você avalia se continua, ajusta ou para." },
    { nome: "criterios_de_sucesso", rotulo: "Critérios de sucesso", tipo: "lista-texto",
      ajuda: "Sinais objetivos de que está dando certo (um por linha)." },
    { nome: "limites_inegociaveis", rotulo: "Limites inegociáveis", tipo: "lista-texto",
      ajuda: "O que você não aceita fazer para atingir o objetivo." },
  ],
});
