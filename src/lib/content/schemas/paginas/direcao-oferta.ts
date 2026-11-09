// src/lib/content/schemas/paginas/direcao-oferta.ts
// Definição da página Direção / Oferta (desenho).
import { definirPagina } from "../definir-pagina";

export default definirPagina("direcao/oferta", {
  relacionadosPadrao: ["direcao/tese-de-valor", "validacao/oferta"],
  placeholderNotas: "Anote variações de preço, pacotes alternativos e dúvidas sobre a oferta.",
  campos: [
    // ── A oferta ─────────────────────────────────────────────────────────────
    { nome: "nome_da_oferta", rotulo: "Nome da oferta", tipo: "texto-curto", grupo: "A oferta", placeholder: "Ex.: Caixa em Dia" },
    { nome: "promessa", rotulo: "Promessa", tipo: "texto-longo", grupo: "A oferta", ajuda: "O que o cliente conquista e em quanto tempo." },
    { nome: "para_quem_e", rotulo: "Para quem é", tipo: "texto-curto", grupo: "A oferta" },
    { nome: "para_quem_nao_e", rotulo: "Para quem NÃO é", tipo: "texto-curto", grupo: "A oferta" },
    { nome: "formato", rotulo: "Formato", tipo: "selecao", grupo: "A oferta", opcoes: [
      { valor: "produto", rotulo: "Produto" },
      { valor: "servico", rotulo: "Serviço" },
      { valor: "assinatura", rotulo: "Assinatura" },
      { valor: "curso", rotulo: "Curso" },
      { valor: "consultoria", rotulo: "Consultoria" },
      { valor: "outro", rotulo: "Outro" },
    ] },

    // ── Entrega ──────────────────────────────────────────────────────────────
    { nome: "entregaveis", rotulo: "O que está incluso", tipo: "lista-texto", grupo: "Entrega" },
    { nome: "como_entrega", rotulo: "Como você entrega", tipo: "texto-longo", grupo: "Entrega",
      ajuda: "Passo a passo do que acontece depois que o cliente compra." },
    { nome: "prazo_de_entrega", rotulo: "Prazo de entrega", tipo: "texto-curto", grupo: "Entrega", placeholder: "Ex.: 7 dias úteis" },
    { nome: "horas_por_cliente", rotulo: "Horas suas por cliente", tipo: "numero", min: 0, unidade: "h", grupo: "Entrega",
      ajuda: "Quanto do seu tempo cada cliente consome (base para saber quantos cabem)." },
    { nome: "capacidade_de_clientes", rotulo: "Quantos clientes você atende ao mesmo tempo", tipo: "numero", inteiro: true, min: 0,
      unidade: "clientes", grupo: "Entrega" },

    // ── Preço e condições ────────────────────────────────────────────────────
    { nome: "preco", rotulo: "Preço", tipo: "moeda", min: 0, grupo: "Preço e condições" },
    // Quando a oferta tem mais de uma versão, cada linha traz uma versão com o seu valor
    { nome: "precos_por_versao", rotulo: "Preço por versão", tipo: "lista-texto", grupo: "Preço e condições",
      placeholder: "Ex.: Versão básica: R$ 10.000" },
    { nome: "modelo_de_cobranca", rotulo: "Modelo de cobrança", tipo: "selecao", grupo: "Preço e condições", opcoes: [
      { valor: "unico", rotulo: "Pagamento único" },
      { valor: "mensal", rotulo: "Mensal" },
      { valor: "anual", rotulo: "Anual" },
      { valor: "por-projeto", rotulo: "Por projeto" },
      { valor: "por-hora", rotulo: "Por hora" },
    ] },
    { nome: "custo_por_cliente", rotulo: "Custo para entregar a um cliente", tipo: "moeda", min: 0, grupo: "Preço e condições",
      ajuda: "Ferramentas, impostos, comissões e outros custos diretos." },
    { nome: "como_chegou_no_preco", rotulo: "Como você chegou neste preço", tipo: "texto-curto", grupo: "Preço e condições",
      placeholder: "Ex.: 3x o custo; comparação com concorrentes; valor do problema" },
    { nome: "garantia", rotulo: "Garantia", tipo: "texto-curto", grupo: "Preço e condições", placeholder: "Ex.: 7 dias ou seu dinheiro de volta" },
    { nome: "bonus", rotulo: "Bônus", tipo: "lista-texto", grupo: "Preço e condições" },
  ],
});
