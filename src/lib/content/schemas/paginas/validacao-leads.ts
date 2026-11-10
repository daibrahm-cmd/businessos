// src/lib/content/schemas/paginas/validacao-leads.ts
// Definição da página Validação / Leads: mini CRM alimentado pelos agentes de prospecção.
import { definirPagina } from "../definir-pagina";

export default definirPagina("validacao/leads", {
  relacionadosPadrao: ["direcao/perfil-de-cliente-ideal", "validacao/primeiros-clientes"],
  placeholderNotas: "Registre aqui o que os agentes de prospecção encontraram e os padrões que você percebeu.",
  campos: [
    { nome: "criterio_de_qualificacao", rotulo: "Critério de qualificação", tipo: "texto-longo",
      ajuda: "O que faz um lead entrar na lista: porte, segmento, sinais de dor." },
    { nome: "meta_de_leads", rotulo: "Meta de leads qualificados", tipo: "numero", inteiro: true, min: 0,
      ajuda: "Quantos leads qualificados você quer ter para iniciar as conversas do teste.", placeholder: "Ex.: 30" },
    { nome: "fontes_de_busca", rotulo: "Onde os agentes buscam", tipo: "lista-texto",
      ajuda: "Sites, diretórios, associações e eventos onde os agentes procuram empresas." },
    { nome: "regras_dos_agentes", rotulo: "Regras para os agentes", tipo: "texto-longo",
      ajuda: "O que os agentes podem e não podem fazer: só fontes públicas, sempre citar a fonte, nunca inventar contato." },
  ],
  colecoes: [
    {
      nome: "leads", rotulo: "Leads", rotuloItem: "Lead",
      campoTitulo: "contato_nome", campoSubtitulo: "empresa", campoDestaque: "estagio",
      ordenarPor: { campo: "entrou", direcao: "desc" },
      // Cards em lista: cargo sob o nome, a nota como texto e os dados curtos no rodapé
      // Abas CNPJ/CPF: lead sem tipo gravado conta como empresa
      abas: { campo: "tipo_pessoa", padrao: "empresa", opcoes: [
        { valor: "empresa", rotulo: "Empresas (CNPJ)" },
        { valor: "pessoa", rotulo: "Pessoas (CPF)" },
      ] },
      lista: { apoioTitulo: "contato_cargo", texto: "nota", meta: ["fonte", "fit", "entrou"] },
      campos: [
        { nome: "contato_nome", rotulo: "Nome do contato", tipo: "texto-curto", obrigatorio: true, placeholder: "Ex.: Ana Souza" },
        { nome: "contato_cargo", rotulo: "Cargo", tipo: "texto-curto", placeholder: "Ex.: Diretora de marketing" },
        { nome: "contato_email", rotulo: "E-mail", tipo: "texto-curto", ajuda: "Só e-mail corporativo publicado pela própria empresa." },
        { nome: "contato_linkedin", rotulo: "LinkedIn", tipo: "texto-curto", placeholder: "https://www.linkedin.com/in/...",
          ajuda: "Link do perfil público do contato (ou, sem perfil, da página da empresa)." },
        { nome: "tipo_pessoa", rotulo: "Tipo", tipo: "selecao", opcoes: [
          { valor: "empresa", rotulo: "Empresa (CNPJ)" },
          { valor: "pessoa", rotulo: "Pessoa (CPF)" },
        ], ajuda: "Empresa (CNPJ) ou pessoa física (CPF). Vazio conta como empresa." },
        { nome: "documento", rotulo: "CNPJ ou CPF", tipo: "texto-curto", placeholder: "00.000.000/0000-00",
          ajuda: "CNPJ é público. CPF só se a própria pessoa informou; nunca buscar CPF de terceiros." },
        { nome: "empresa", rotulo: "Empresa", tipo: "texto-curto", obrigatorio: true, placeholder: "Ex.: Metalúrgica Silva" },
        { nome: "nota", rotulo: "Por que é lead", tipo: "texto-curto",
          ajuda: "Uma frase: o sinal que o agente viu (dor, momento da empresa, encaixe com o perfil)." },
        { nome: "fonte", rotulo: "Fonte", tipo: "selecao", opcoes: [
          { valor: "linkedin", rotulo: "LinkedIn" },
          { valor: "site-institucional", rotulo: "Site institucional" },
          { valor: "indicacao", rotulo: "Indicação" },
          { valor: "evento", rotulo: "Evento" },
          { valor: "diretorio", rotulo: "Diretório ou associação" },
          { valor: "outro", rotulo: "Outro" },
        ] },
        { nome: "fonte_link", rotulo: "Link da fonte", tipo: "texto-curto", placeholder: "https://...",
          ajuda: "Matéria ou página pública onde o agente viu o sinal." },
        { nome: "encontrado_por", rotulo: "Encontrado por", tipo: "texto-curto", ajuda: "Nome do agente que trouxe o lead." },
        { nome: "fit", rotulo: "Fit com o perfil", tipo: "numero", inteiro: true, min: 0, max: 100, unidade: "pts",
          ajuda: "De 0 a 100: o quanto o lead se parece com o cliente ideal." },
        { nome: "estagio", rotulo: "Estágio", tipo: "selecao", obrigatorio: true, opcoes: [
          { valor: "novo", rotulo: "Novo" },
          { valor: "contatado", rotulo: "Contatado" },
          { valor: "qualificado", rotulo: "Qualificado" },
          { valor: "em-negociacao", rotulo: "Em negociação" },
          { valor: "ganho", rotulo: "Ganho" },
          { valor: "perdido", rotulo: "Perdido" },
        ] },
        { nome: "entrou", rotulo: "Entrou em", tipo: "data", ajuda: "Data em que o lead entrou na lista." },
      ],
      resumos: [
        { tipo: "contagem", rotulo: "Novo", filtro: { campo: "estagio", valor: "novo" } },
        { tipo: "contagem", rotulo: "Qualificado", filtro: { campo: "estagio", valor: "qualificado" } },
        { tipo: "contagem", rotulo: "Em negociação", filtro: { campo: "estagio", valor: "em-negociacao" } },
        { tipo: "contagem", rotulo: "Ganho", filtro: { campo: "estagio", valor: "ganho" } },
      ],
    },
  ],
});
