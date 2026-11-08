// src/lib/content/schemas/paginas/caixa-erp.ts
// Definição da página Caixa / ERP.
import { definirPagina } from "../definir-pagina";

export default definirPagina("caixa/erp", {
  relacionadosPadrao: ["caixa/fluxo-de-caixa"],
  placeholderNotas: "Anote acessos (sem senhas), contatos de suporte e ideias de melhoria da operação.",
  campos: [
    { nome: "sistema_principal", rotulo: "Sistema principal", tipo: "texto-curto",
      placeholder: "Ex.: planilha, Bling, Omie, Notion" },
    { nome: "regime_tributario", rotulo: "Regime tributário", tipo: "selecao", opcoes: [
      { valor: "nao-formalizado", rotulo: "Não formalizado" },
      { valor: "mei", rotulo: "MEI" },
      { valor: "simples-nacional", rotulo: "Simples Nacional" },
      { valor: "lucro-presumido", rotulo: "Lucro Presumido" },
      { valor: "outro", rotulo: "Outro" },
    ] },
    { nome: "formas_de_recebimento", rotulo: "Formas de recebimento", tipo: "lista-texto",
      ajuda: "Pix, cartão, boleto…" },
    { nome: "rotina_financeira", rotulo: "Rotina financeira", tipo: "texto-longo",
      ajuda: "O que acontece toda semana e todo mês: conciliar, cobrar, pagar, emitir nota." },
    { nome: "gargalos", rotulo: "Gargalos operacionais", tipo: "lista-texto" },
    { nome: "proximas_automacoes", rotulo: "Próximas automações", tipo: "lista-texto",
      ajuda: "O que automatizar primeiro." },
  ],
  colecoes: [
    {
      nome: "processos", rotulo: "Processos", rotuloItem: "Processo",
      campoTitulo: "nome", campoSubtitulo: "responsavel", campoDestaque: "situacao",
      campos: [
        { nome: "nome", rotulo: "Processo", tipo: "texto-curto", obrigatorio: true,
          placeholder: "Ex.: Emissão de nota fiscal" },
        { nome: "area", rotulo: "Área", tipo: "selecao", opcoes: [
          { valor: "vendas", rotulo: "Vendas" },
          { valor: "financeiro", rotulo: "Financeiro" },
          { valor: "entrega", rotulo: "Entrega" },
          { valor: "atendimento", rotulo: "Atendimento" },
          { valor: "marketing", rotulo: "Marketing" },
          { valor: "administrativo", rotulo: "Administrativo" },
        ] },
        { nome: "responsavel", rotulo: "Responsável", tipo: "texto-curto" },
        { nome: "frequencia", rotulo: "Frequência", tipo: "selecao", opcoes: [
          { valor: "diaria", rotulo: "Diária" },
          { valor: "semanal", rotulo: "Semanal" },
          { valor: "mensal", rotulo: "Mensal" },
          { valor: "sob-demanda", rotulo: "Sob demanda" },
        ] },
        { nome: "ferramenta", rotulo: "Ferramenta", tipo: "texto-curto" },
        { nome: "situacao", rotulo: "Situação", tipo: "selecao", opcoes: [
          { valor: "manual", rotulo: "Manual" },
          { valor: "parcial", rotulo: "Parcialmente automatizado" },
          { valor: "automatizado", rotulo: "Automatizado" },
        ] },
        { nome: "descricao", rotulo: "Como funciona", tipo: "texto-longo", ajuda: "Passo a passo resumido." },
      ],
      resumos: [
        { tipo: "contagem", rotulo: "Processos manuais", filtro: { campo: "situacao", valor: "manual" } },
      ],
    },
    {
      nome: "ferramentas", rotulo: "Ferramentas", rotuloItem: "Ferramenta",
      campoTitulo: "nome", campoSubtitulo: "uso", campoDestaque: "situacao",
      campos: [
        { nome: "nome", rotulo: "Ferramenta", tipo: "texto-curto", obrigatorio: true },
        { nome: "uso", rotulo: "Para que serve", tipo: "texto-curto" },
        { nome: "custo_mensal", rotulo: "Custo mensal", tipo: "moeda", min: 0 },
        { nome: "link", rotulo: "Link", tipo: "texto-curto" },
        { nome: "situacao", rotulo: "Situação", tipo: "selecao", opcoes: [
          { valor: "em-uso", rotulo: "Em uso" },
          { valor: "testando", rotulo: "Testando" },
          { valor: "cancelada", rotulo: "Cancelada" },
        ] },
      ],
      resumos: [
        { tipo: "soma", rotulo: "Custo mensal em uso", campo: "custo_mensal", filtro: { campo: "situacao", valor: "em-uso" } },
      ],
    },
  ],
});
