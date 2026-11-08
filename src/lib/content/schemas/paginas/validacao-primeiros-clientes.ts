// src/lib/content/schemas/paginas/validacao-primeiros-clientes.ts
// Definição da página Validação / Primeiros Clientes.
import { definirPagina } from "../definir-pagina";

export default definirPagina("validacao/primeiros-clientes", {
  relacionadosPadrao: ["direcao/perfil-de-cliente-ideal", "validacao/oferta"],
  placeholderNotas: "Registre aqui conversas marcantes, frases literais e padrões que você percebeu.",
  campos: [
    { nome: "meta_de_clientes", rotulo: "Meta de clientes no teste", tipo: "numero", inteiro: true, min: 0,
      ajuda: "Quantos clientes pagantes provam que a oferta funciona.", placeholder: "Ex.: 5" },
    { nome: "prazo_da_meta", rotulo: "Prazo da meta", tipo: "data" },
    { nome: "roteiro_de_abordagem", rotulo: "Roteiro de abordagem", tipo: "texto-longo",
      ajuda: "Como você inicia a conversa e apresenta a oferta." },
    { nome: "principais_aprendizados", rotulo: "Principais aprendizados", tipo: "lista-texto" },
    { nome: "objecoes_recorrentes", rotulo: "Objeções recorrentes", tipo: "lista-texto" },
  ],
  colecoes: [
    {
      nome: "clientes", rotulo: "Clientes", rotuloItem: "Cliente",
      campoTitulo: "nome", campoSubtitulo: "contato", campoDestaque: "status",
      campos: [
        { nome: "nome", rotulo: "Nome", tipo: "texto-curto", obrigatorio: true, placeholder: "Ex.: Ana Souza" },
        { nome: "contato", rotulo: "Contato", tipo: "texto-curto", ajuda: "WhatsApp, e-mail ou @." },
        { nome: "origem", rotulo: "Origem", tipo: "selecao", opcoes: [
          { valor: "indicacao", rotulo: "Indicação" },
          { valor: "rede-pessoal", rotulo: "Rede pessoal" },
          { valor: "instagram", rotulo: "Instagram" },
          { valor: "linkedin", rotulo: "LinkedIn" },
          { valor: "whatsapp", rotulo: "WhatsApp" },
          { valor: "evento", rotulo: "Evento" },
          { valor: "outro", rotulo: "Outro" },
        ] },
        { nome: "status", rotulo: "Status", tipo: "selecao", obrigatorio: true, opcoes: [
          { valor: "prospect", rotulo: "Prospect" },
          { valor: "conversa", rotulo: "Em conversa" },
          { valor: "proposta", rotulo: "Proposta enviada" },
          { valor: "fechado", rotulo: "Fechado" },
          { valor: "perdido", rotulo: "Perdido" },
        ] },
        { nome: "valor", rotulo: "Valor", tipo: "moeda", min: 0, ajuda: "Valor fechado ou proposto." },
        { nome: "proximo_passo", rotulo: "Próximo passo", tipo: "texto-curto", placeholder: "Ex.: Enviar proposta até sexta" },
        { nome: "aprendizado", rotulo: "Aprendizado", tipo: "texto-longo", ajuda: "O que esta conversa ensinou." },
      ],
      resumos: [
        { tipo: "contagem", rotulo: "Clientes fechados", filtro: { campo: "status", valor: "fechado" } },
        { tipo: "soma", rotulo: "Receita fechada", campo: "valor", filtro: { campo: "status", valor: "fechado" } },
      ],
    },
  ],
});
