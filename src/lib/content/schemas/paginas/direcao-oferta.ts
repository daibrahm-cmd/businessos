// src/lib/content/schemas/paginas/direcao-oferta.ts
// Definição da página Direção / Oferta (desenho).
import { definirPagina } from "../definir-pagina";

export default definirPagina("direcao/oferta", {
  relacionadosPadrao: ["direcao/tese-de-valor", "validacao/oferta"],
  placeholderNotas: "Anote variações de preço, pacotes alternativos e dúvidas sobre a oferta.",
  campos: [
    { nome: "nome_da_oferta", rotulo: "Nome da oferta", tipo: "texto-curto", placeholder: "Ex.: Caixa em Dia" },
    { nome: "promessa", rotulo: "Promessa", tipo: "texto-longo", ajuda: "O que o cliente conquista e em quanto tempo." },
    { nome: "entregaveis", rotulo: "O que está incluso", tipo: "lista-texto" },
    { nome: "formato", rotulo: "Formato", tipo: "selecao", opcoes: [
      { valor: "produto", rotulo: "Produto" },
      { valor: "servico", rotulo: "Serviço" },
      { valor: "assinatura", rotulo: "Assinatura" },
      { valor: "curso", rotulo: "Curso" },
      { valor: "consultoria", rotulo: "Consultoria" },
      { valor: "outro", rotulo: "Outro" },
    ] },
    { nome: "preco", rotulo: "Preço", tipo: "moeda", min: 0 },
    { nome: "modelo_de_cobranca", rotulo: "Modelo de cobrança", tipo: "selecao", opcoes: [
      { valor: "unico", rotulo: "Pagamento único" },
      { valor: "mensal", rotulo: "Mensal" },
      { valor: "anual", rotulo: "Anual" },
      { valor: "por-projeto", rotulo: "Por projeto" },
      { valor: "por-hora", rotulo: "Por hora" },
    ] },
    { nome: "garantia", rotulo: "Garantia", tipo: "texto-curto", placeholder: "Ex.: 7 dias ou seu dinheiro de volta" },
    { nome: "bonus", rotulo: "Bônus", tipo: "lista-texto" },
  ],
});
