// src/lib/content/schemas/paginas/caixa-fluxo-de-caixa.ts
// Definição da página Caixa / Fluxo de Caixa (operação).
import { definirPagina, OPCOES_TIPO_LANCAMENTO } from "../definir-pagina";

export default definirPagina("caixa/fluxo-de-caixa", {
  relacionadosPadrao: ["caixa/erp", "founder/estilo-de-vida"],
  placeholderNotas: "Anote decisões de caixa, renegociações e alertas do mês.",
  campos: [
    { nome: "saldo_inicial", rotulo: "Saldo inicial", tipo: "moeda", ajuda: "Saldo em conta na data abaixo." },
    { nome: "data_do_saldo_inicial", rotulo: "Data do saldo inicial", tipo: "data" },
    { nome: "custo_fixo_mensal", rotulo: "Custo fixo mensal", tipo: "moeda", min: 0 },
    { nome: "meta_de_receita_mensal", rotulo: "Meta de receita mensal", tipo: "moeda", min: 0 },
    { nome: "pro_labore", rotulo: "Pró-labore", tipo: "moeda", min: 0, ajuda: "Retirada mensal combinada." },
    { nome: "reserva_minima", rotulo: "Reserva mínima", tipo: "moeda", min: 0,
      ajuda: "Abaixo deste saldo, acenda o alerta." },
  ],
  colecoes: [
    {
      nome: "lancamentos", rotulo: "Lançamentos", rotuloItem: "Lançamento",
      campoTitulo: "descricao", campoSubtitulo: "data", campoDestaque: "status",
      ordenarPor: { campo: "data", direcao: "desc" },
      campos: [
        { nome: "data", rotulo: "Data", tipo: "data", obrigatorio: true },
        { nome: "descricao", rotulo: "Descrição", tipo: "texto-curto", obrigatorio: true },
        { nome: "tipo", rotulo: "Tipo", tipo: "selecao", obrigatorio: true, opcoes: OPCOES_TIPO_LANCAMENTO },
        { nome: "valor", rotulo: "Valor", tipo: "moeda", obrigatorio: true, min: 0 },
        { nome: "categoria", rotulo: "Categoria", tipo: "selecao", opcoes: [
          { valor: "receita-de-vendas", rotulo: "Receita de vendas" },
          { valor: "outras-receitas", rotulo: "Outras receitas" },
          { valor: "pro-labore", rotulo: "Pró-labore" },
          { valor: "impostos", rotulo: "Impostos" },
          { valor: "ferramentas", rotulo: "Ferramentas" },
          { valor: "marketing", rotulo: "Marketing" },
          { valor: "fornecedores", rotulo: "Fornecedores" },
          { valor: "pessoal", rotulo: "Pessoal" },
          { valor: "outros", rotulo: "Outros" },
        ] },
        { nome: "recorrencia", rotulo: "Recorrência", tipo: "selecao", opcoes: [
          { valor: "unica", rotulo: "Única" },
          { valor: "mensal", rotulo: "Mensal" },
          { valor: "anual", rotulo: "Anual" },
        ] },
        { nome: "status", rotulo: "Situação", tipo: "selecao", opcoes: [
          { valor: "previsto", rotulo: "Previsto" },
          { valor: "realizado", rotulo: "Realizado" },
        ] },
      ],
      // Exatamente dois resumos; projeções ficam para a Fase 2.
      resumos: [
        { tipo: "saldo", rotulo: "Saldo realizado", campo: "valor", campoTipo: "tipo",
          entrada: "entrada", saida: "saida", campoBase: "saldo_inicial",
          filtro: { campo: "status", valor: "realizado" } },
        { tipo: "soma", rotulo: "Total de saídas", campo: "valor",
          filtro: { campo: "tipo", valor: "saida" } }, // inclui previstas e realizadas
      ],
    },
  ],
});
