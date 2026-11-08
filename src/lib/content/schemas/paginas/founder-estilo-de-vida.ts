// src/lib/content/schemas/paginas/founder-estilo-de-vida.ts
// Definição da página Founder / Estilo de Vida.
import { definirPagina } from "../definir-pagina";

export default definirPagina("founder/estilo-de-vida", {
  relacionadosPadrao: ["founder/objetivo", "caixa/fluxo-de-caixa"],
  placeholderNotas: "Registre combinados com a família, fases da vida e qualquer restrição que o negócio precisa respeitar.",
  campos: [
    { nome: "horas_por_semana", rotulo: "Horas por semana", tipo: "numero", inteiro: true, min: 0, max: 168, unidade: "h",
      ajuda: "Tempo real que você pode dedicar ao negócio.", placeholder: "Ex.: 25" },
    { nome: "dedicacao", rotulo: "Dedicação", tipo: "selecao", opcoes: [
      { valor: "integral", rotulo: "Tempo integral" },
      { valor: "parcial", rotulo: "Tempo parcial" },
      { valor: "paralela", rotulo: "Em paralelo a um emprego" },
    ] },
    { nome: "retirada_desejada", rotulo: "Retirada mensal desejada", tipo: "moeda", min: 0,
      ajuda: "Quanto você quer tirar do negócio por mês quando ele estiver de pé." },
    { nome: "folego_em_meses", rotulo: "Fôlego financeiro", tipo: "numero", min: 0, unidade: "meses",
      ajuda: "Quantos meses você se sustenta sem renda do negócio." },
    { nome: "modelo_de_trabalho", rotulo: "Modelo de trabalho", tipo: "selecao", opcoes: [
      { valor: "remoto", rotulo: "Remoto" },
      { valor: "presencial", rotulo: "Presencial" },
      { valor: "hibrido", rotulo: "Híbrido" },
    ] },
    { nome: "rotina_ideal", rotulo: "Rotina ideal", tipo: "texto-longo",
      ajuda: "Como é uma semana boa de trabalho para você." },
    { nome: "inegociaveis_pessoais", rotulo: "Inegociáveis da vida pessoal", tipo: "lista-texto",
      placeholder: "Ex.: buscar as crianças na escola às 17h" },
  ],
});
