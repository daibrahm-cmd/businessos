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
      campoTitulo: "empresa", campoSubtitulo: "segmento", campoDestaque: "status",
      // Limite do projeto: 4 a 8 campos por coleção. Site, cidade, faturamento estimado, agente e data do achado
      // entram em "Observações" (texto livre) para manter o cartão simples.
      campos: [
        { nome: "empresa", rotulo: "Empresa", tipo: "texto-curto", obrigatorio: true, placeholder: "Ex.: Metalúrgica Silva" },
        { nome: "status", rotulo: "Status", tipo: "selecao", obrigatorio: true, opcoes: [
          { valor: "novo", rotulo: "Novo" },
          { valor: "qualificado", rotulo: "Qualificado" },
          { valor: "abordado", rotulo: "Abordado" },
          { valor: "em-conversa", rotulo: "Em conversa" },
          { valor: "proposta", rotulo: "Proposta enviada" },
          { valor: "fechado", rotulo: "Fechado" },
          { valor: "perdido", rotulo: "Perdido" },
        ] },
        { nome: "segmento", rotulo: "Segmento", tipo: "selecao", opcoes: [
          { valor: "industria", rotulo: "Indústria" },
          { valor: "empresa-em-escala", rotulo: "Empresa em fase de escala" },
          { valor: "marketing-enxuto", rotulo: "Equipe enxuta de marketing" },
          { valor: "servicos-profissionais", rotulo: "Serviços profissionais" },
          { valor: "produto-digital", rotulo: "Produto digital" },
          { valor: "outro", rotulo: "Outro" },
        ] },
        { nome: "aderencia", rotulo: "Aderência ao perfil", tipo: "selecao", opcoes: [
          { valor: "alta", rotulo: "Alta" },
          { valor: "media", rotulo: "Média" },
          { valor: "baixa", rotulo: "Baixa" },
        ] },
        { nome: "contato", rotulo: "Contato", tipo: "texto-curto",
          placeholder: "Nome, cargo e e-mail ou LinkedIn. Ex.: Ana Souza, diretora de marketing, linkedin.com/in/ana" },
        { nome: "fonte", rotulo: "Fonte do achado", tipo: "texto-curto", ajuda: "Link de onde o agente encontrou o lead." },
        { nome: "proximo_passo", rotulo: "Próximo passo", tipo: "texto-curto", placeholder: "Ex.: Enviar mensagem pelo LinkedIn" },
        { nome: "observacoes", rotulo: "Observações", tipo: "texto-longo",
          ajuda: "Site, cidade, faturamento estimado, agente que trouxe, data do achado e última interação." },
      ],
      resumos: [
        { tipo: "contagem", rotulo: "Total de leads" },
        { tipo: "contagem", rotulo: "Qualificados", filtro: { campo: "status", valor: "qualificado" } },
        { tipo: "contagem", rotulo: "Em conversa", filtro: { campo: "status", valor: "em-conversa" } },
        { tipo: "contagem", rotulo: "Fechados", filtro: { campo: "status", valor: "fechado" } },
      ],
    },
  ],
});
