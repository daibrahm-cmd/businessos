// src/lib/content/schemas/paginas/validacao-oferta.ts
// Definição da página Validação / Oferta (teste).
import { definirPagina } from "../definir-pagina";

export default definirPagina("validacao/oferta", {
  relacionadosPadrao: ["direcao/oferta", "validacao/primeiros-clientes"],
  placeholderNotas: "Registre o que o mercado respondeu a cada rodada do teste.",
  campos: [
    { nome: "hipotese_testada", rotulo: "Hipótese em teste", tipo: "texto-longo",
      placeholder: "Ex.: MEIs de beleza pagam R$ 197/mês para ter o caixa organizado" },
    { nome: "versao_testada", rotulo: "Versão testada", tipo: "texto-longo",
      ajuda: "Exatamente o que foi apresentado: preço, entrega, prazo." },
    { nome: "preco_testado", rotulo: "Preço testado", tipo: "moeda", min: 0 },
    { nome: "canal_do_teste", rotulo: "Canal do teste", tipo: "selecao", opcoes: [
      { valor: "indicacao", rotulo: "Indicação" },
      { valor: "whatsapp", rotulo: "WhatsApp" },
      { valor: "instagram", rotulo: "Instagram" },
      { valor: "linkedin", rotulo: "LinkedIn" },
      { valor: "presencial", rotulo: "Presencial" },
      { valor: "anuncio", rotulo: "Anúncio" },
      { valor: "outro", rotulo: "Outro" },
    ] },
    { nome: "meta_de_conversao", rotulo: "Meta de conversão", tipo: "numero", min: 0, max: 100, unidade: "%",
      ajuda: "Percentual de conversas que precisam virar venda." },
    { nome: "inicio_do_teste", rotulo: "Início do teste", tipo: "data" },
    { nome: "fim_do_teste", rotulo: "Fim do teste", tipo: "data" },
    { nome: "veredito", rotulo: "Veredito", tipo: "selecao", opcoes: [
      { valor: "em-andamento", rotulo: "Em andamento" },
      { valor: "manter", rotulo: "Manter" },
      { valor: "ajustar", rotulo: "Ajustar" },
      { valor: "descartar", rotulo: "Descartar" },
    ], ajuda: "Persistir, pivotar ou parar." },
  ],
  colecoes: [
    {
      nome: "iteracoes", rotulo: "Iterações", rotuloItem: "Iteração",
      campoTitulo: "mudanca", campoSubtitulo: "data",
      ordenarPor: { campo: "data", direcao: "desc" },
      campos: [
        { nome: "data", rotulo: "Data", tipo: "data", obrigatorio: true },
        { nome: "mudanca", rotulo: "O que mudou", tipo: "texto-curto", obrigatorio: true,
          placeholder: "Ex.: Preço de R$ 297 para R$ 197" },
        { nome: "motivo", rotulo: "Motivo", tipo: "texto-longo", ajuda: "O que o mercado mostrou." },
        { nome: "resultado", rotulo: "Resultado", tipo: "texto-longo", ajuda: "O que aconteceu depois da mudança." },
      ],
      resumos: [{ tipo: "contagem", rotulo: "Iterações" }],
    },
  ],
});
