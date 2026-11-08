// src/lib/content/schemas/paginas/validacao-fluxo-de-caixa.ts
// Definição da página Validação / Fluxo de Caixa (orçamento do teste).
import { definirPagina, OPCOES_TIPO_LANCAMENTO } from "../definir-pagina";

export default definirPagina("validacao/fluxo-de-caixa", {
  relacionadosPadrao: ["validacao/oferta", "founder/estilo-de-vida"],
  placeholderNotas: "Anote decisões de gasto, cortes e o que você aprendeu sobre custo de aquisição.",
  campos: [
    { nome: "orcamento_do_teste", rotulo: "Orçamento do teste", tipo: "moeda", min: 0,
      ajuda: "Quanto você pode gastar para validar." },
    { nome: "caixa_disponivel", rotulo: "Caixa disponível hoje", tipo: "moeda" },
    { nome: "limite_de_perda", rotulo: "Limite de perda", tipo: "moeda", min: 0,
      ajuda: "Se perder este valor, você para o teste." },
    { nome: "receita_esperada", rotulo: "Receita esperada no teste", tipo: "moeda", min: 0 },
    { nome: "data_limite", rotulo: "Data limite do teste", tipo: "data" },
    { nome: "premissas_de_custo", rotulo: "Premissas de custo", tipo: "lista-texto",
      placeholder: "Ex.: anúncio de R$ 20/dia por 15 dias" },
  ],
  colecoes: [
    {
      nome: "lancamentos", rotulo: "Lançamentos", rotuloItem: "Lançamento",
      campoTitulo: "descricao", campoSubtitulo: "data", campoDestaque: "tipo",
      ordenarPor: { campo: "data", direcao: "desc" },
      campos: [
        { nome: "data", rotulo: "Data", tipo: "data", obrigatorio: true },
        { nome: "descricao", rotulo: "Descrição", tipo: "texto-curto", obrigatorio: true,
          placeholder: "Ex.: Impulsionamento Instagram" },
        { nome: "tipo", rotulo: "Tipo", tipo: "selecao", obrigatorio: true, opcoes: OPCOES_TIPO_LANCAMENTO },
        { nome: "valor", rotulo: "Valor", tipo: "moeda", obrigatorio: true, min: 0,
          ajuda: "Sempre positivo; o tipo define se entra ou sai." },
        { nome: "categoria", rotulo: "Categoria", tipo: "selecao", opcoes: [
          { valor: "ferramentas", rotulo: "Ferramentas" },
          { valor: "marketing", rotulo: "Marketing" },
          { valor: "materiais", rotulo: "Materiais" },
          { valor: "deslocamento", rotulo: "Deslocamento" },
          { valor: "vendas", rotulo: "Vendas" },
          { valor: "outros", rotulo: "Outros" },
        ] },
      ],
      resumos: [
        { tipo: "saldo", rotulo: "Saldo do teste", campo: "valor", campoTipo: "tipo", entrada: "entrada", saida: "saida" },
        { tipo: "soma", rotulo: "Gasto até agora", campo: "valor", filtro: { campo: "tipo", valor: "saida" } },
      ],
    },
  ],
});
