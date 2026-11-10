// Dados de exemplo para as stories (Storybook) dos componentes do BusinessOS.
// São autocontidos de propósito: copiam as definições da §3.7 e os exemplos da §3.8 da spec,
// para que as stories não dependam da camada de conteúdo (servidor, arquivos, schemas da 2A).
import { NAVEGACAO, hrefDoDocumento, type DocId, type PaginaNav, type SecaoNav } from "@/lib/content/navigation"
import type {
  CampoData,
  CampoLista,
  CampoMoeda,
  CampoNumero,
  CampoSelecao,
  CampoTexto,
  PageDefinition,
} from "@/lib/content/schemas/field-types"
import type { ContentDoc, ResumoCalculado, Status } from "@/lib/content/types"

/** Marca de "nunca salvo" (mesmo valor de DATA_EPOCA da camada de conteúdo). */
export const DATA_EPOCA_FIXTURE = "1970-01-01T00:00:00.000Z"

// ---------------------------------------------------------------------------
// Um campo de cada tipo (para as stories de FieldCard)
// ---------------------------------------------------------------------------

export const campoTextoCurto: CampoTexto = {
  nome: "meta_12_meses",
  rotulo: "Meta para 12 meses",
  tipo: "texto-curto",
  ajuda: "Um resultado mensurável.",
  placeholder: "Ex.: 25 clientes recorrentes",
}

export const campoTextoLongo: CampoTexto = {
  nome: "objetivo_principal",
  rotulo: "Objetivo principal",
  tipo: "texto-longo",
  ajuda: "Em uma ou duas frases: o que você quer que este negócio realize.",
  placeholder: "Ex.: Ter uma consultoria que me pague R$ 12 mil/mês trabalhando 30 h por semana.",
}

export const campoNumero: CampoNumero = {
  nome: "horas_por_semana",
  rotulo: "Horas por semana",
  tipo: "numero",
  inteiro: true,
  min: 0,
  max: 168,
  unidade: "h",
  ajuda: "Tempo real que você pode dedicar ao negócio.",
  placeholder: "Ex.: 25",
}

export const campoMoeda: CampoMoeda = {
  nome: "renda_minima_mensal",
  rotulo: "Renda mínima que você precisa",
  tipo: "moeda",
  min: 0,
  ajuda: "Quanto o negócio precisa te pagar por mês para valer a pena.",
}

export const campoLista: CampoLista = {
  nome: "criterios_de_sucesso",
  rotulo: "Critérios de sucesso",
  tipo: "lista-texto",
  ajuda: "Sinais objetivos de que está dando certo.",
}

export const campoSelecao: CampoSelecao = {
  nome: "dedicacao",
  rotulo: "Dedicação",
  tipo: "selecao",
  opcoes: [
    { valor: "integral", rotulo: "Tempo integral" },
    { valor: "parcial", rotulo: "Tempo parcial" },
    { valor: "paralela", rotulo: "Em paralelo a um emprego" },
  ],
}

export const campoData: CampoData = {
  nome: "data_de_decisao",
  rotulo: "Data de decisão",
  tipo: "data",
  ajuda: "Até quando você avalia se continua, ajusta ou para.",
}

// ---------------------------------------------------------------------------
// Definições de página (cópias fiéis da §3.7)
// ---------------------------------------------------------------------------

/** §3.7.9 — validacao/primeiros-clientes (campos + coleção "clientes"). */
export const defPrimeirosClientes: PageDefinition = {
  id: "validacao/primeiros-clientes",
  secao: "validacao",
  pagina: "primeiros-clientes",
  titulo: "Primeiros Clientes",
  descricao: "Os primeiros clientes e conversas de venda como evidência de validação.",
  relacionadosPadrao: ["direcao/perfil-de-cliente-ideal", "validacao/oferta"],
  placeholderNotas:
    "Registre aqui conversas marcantes, frases literais e padrões que você percebeu.",
  campos: [
    {
      nome: "meta_de_clientes",
      rotulo: "Meta de clientes no teste",
      tipo: "numero",
      inteiro: true,
      min: 0,
      ajuda: "Quantos clientes pagantes provam que a oferta funciona.",
      placeholder: "Ex.: 5",
    },
    { nome: "prazo_da_meta", rotulo: "Prazo da meta", tipo: "data" },
    {
      nome: "roteiro_de_abordagem",
      rotulo: "Roteiro de abordagem",
      tipo: "texto-longo",
      ajuda: "Como você inicia a conversa e apresenta a oferta.",
    },
    { nome: "principais_aprendizados", rotulo: "Principais aprendizados", tipo: "lista-texto" },
    { nome: "objecoes_recorrentes", rotulo: "Objeções recorrentes", tipo: "lista-texto" },
  ],
  colecoes: [
    {
      nome: "clientes",
      rotulo: "Clientes",
      rotuloItem: "Cliente",
      campoTitulo: "nome",
      campoSubtitulo: "contato",
      campoDestaque: "status",
      campos: [
        { nome: "nome", rotulo: "Nome", tipo: "texto-curto", obrigatorio: true, placeholder: "Ex.: Ana Souza" },
        { nome: "contato", rotulo: "Contato", tipo: "texto-curto", ajuda: "WhatsApp, e-mail ou @." },
        {
          nome: "origem",
          rotulo: "Origem",
          tipo: "selecao",
          opcoes: [
            { valor: "indicacao", rotulo: "Indicação" },
            { valor: "rede-pessoal", rotulo: "Rede pessoal" },
            { valor: "instagram", rotulo: "Instagram" },
            { valor: "linkedin", rotulo: "LinkedIn" },
            { valor: "whatsapp", rotulo: "WhatsApp" },
            { valor: "evento", rotulo: "Evento" },
            { valor: "outro", rotulo: "Outro" },
          ],
        },
        {
          nome: "status",
          rotulo: "Status",
          tipo: "selecao",
          obrigatorio: true,
          opcoes: [
            { valor: "prospect", rotulo: "Prospect" },
            { valor: "conversa", rotulo: "Em conversa" },
            { valor: "proposta", rotulo: "Proposta enviada" },
            { valor: "fechado", rotulo: "Fechado" },
            { valor: "perdido", rotulo: "Perdido" },
          ],
        },
        { nome: "valor", rotulo: "Valor", tipo: "moeda", min: 0, ajuda: "Valor fechado ou proposto." },
        {
          nome: "proximo_passo",
          rotulo: "Próximo passo",
          tipo: "texto-curto",
          placeholder: "Ex.: Enviar proposta até sexta",
        },
        {
          nome: "aprendizado",
          rotulo: "Aprendizado",
          tipo: "texto-longo",
          ajuda: "O que esta conversa ensinou.",
        },
      ],
      resumos: [
        { tipo: "contagem", rotulo: "Clientes fechados", filtro: { campo: "status", valor: "fechado" } },
        {
          tipo: "soma",
          rotulo: "Receita fechada",
          campo: "valor",
          filtro: { campo: "status", valor: "fechado" },
        },
      ],
    },
  ],
}

/** §3.7.5 — direcao/perfil-de-cliente-ideal (só campos). */
export const defPerfilClienteIdeal: PageDefinition = {
  id: "direcao/perfil-de-cliente-ideal",
  secao: "direcao",
  pagina: "perfil-de-cliente-ideal",
  titulo: "Perfil de Cliente Ideal",
  descricao: "Quem mais sente o problema escolhido e como essa pessoa decide comprar.",
  relacionadosPadrao: ["direcao/ima-de-problemas", "direcao/tese-de-valor"],
  campos: [
    {
      nome: "quem_e",
      rotulo: "Quem é",
      tipo: "texto-longo",
      ajuda: "Descreva uma pessoa (ou empresa) específica, como se fosse real.",
    },
    {
      nome: "dados_demograficos",
      rotulo: "Dados demográficos",
      tipo: "lista-texto",
      ajuda: "Idade, renda, profissão, região, tamanho da empresa.",
    },
    { nome: "dores", rotulo: "Dores", tipo: "lista-texto", ajuda: "O que incomoda, custa caro ou tira o sono." },
    { nome: "desejos", rotulo: "Desejos", tipo: "lista-texto", ajuda: "O resultado que ela quer, nas palavras dela." },
    {
      nome: "onde_esta",
      rotulo: "Onde está",
      tipo: "lista-texto",
      ajuda: "Canais, comunidades, eventos e perfis que acompanha.",
    },
    {
      nome: "gatilhos_de_compra",
      rotulo: "Gatilhos de compra",
      tipo: "lista-texto",
      ajuda: "Eventos que fazem a pessoa procurar uma solução agora.",
    },
    { nome: "objecoes", rotulo: "Objeções", tipo: "lista-texto", ajuda: 'Por que ela diria "não" ou "agora não".' },
    {
      nome: "quanto_paga_hoje",
      rotulo: "Quanto paga hoje",
      tipo: "moeda",
      min: 0,
      ajuda: "Gasto mensal atual com alternativas ao seu produto.",
    },
  ],
  colecoes: [
    {
      // Espelha a coleção "personas" do schema real (direcao-perfil-de-cliente-ideal.ts)
      nome: "personas",
      rotulo: "Personas",
      rotuloItem: "Persona",
      descricao: "Perfis distintos de cliente ideal. Cada um com quem é, momento, contexto e gatilhos.",
      campoTitulo: "nome",
      campoSubtitulo: "arquetipo",
      lista: { variante: "persona", apoioTitulo: "perfil", texto: "momento", chips: "gatilhos" },
      campos: [
        { nome: "nome", rotulo: "Nome da persona", tipo: "texto-curto", obrigatorio: true, placeholder: "Ex.: O Reinventor" },
        { nome: "arquetipo", rotulo: "Em uma frase", tipo: "texto-curto" },
        { nome: "perfil", rotulo: "Perfil", tipo: "texto-curto" },
        { nome: "psicografia", rotulo: "Psicografia", tipo: "texto-longo" },
        { nome: "momento", rotulo: "Momento", tipo: "texto-longo" },
        { nome: "contexto", rotulo: "Contexto", tipo: "texto-longo" },
        { nome: "gatilhos", rotulo: "Gatilhos", tipo: "lista-texto" },
      ],
    },
  ],
}

/** §3.7.11 — caixa/fluxo-de-caixa (coleção com saldo; bom para resumo negativo). */
export const defFluxoDeCaixa: PageDefinition = {
  id: "caixa/fluxo-de-caixa",
  secao: "caixa",
  pagina: "fluxo-de-caixa",
  titulo: "Fluxo de Caixa",
  descricao: "A operação recorrente: entradas, saídas, saldo e projeção.",
  relacionadosPadrao: ["caixa/erp", "founder/estilo-de-vida"],
  campos: [
    { nome: "saldo_inicial", rotulo: "Saldo inicial", tipo: "moeda", ajuda: "Saldo em conta na data abaixo." },
    { nome: "data_do_saldo_inicial", rotulo: "Data do saldo inicial", tipo: "data" },
    { nome: "custo_fixo_mensal", rotulo: "Custo fixo mensal", tipo: "moeda", min: 0 },
    { nome: "meta_de_receita_mensal", rotulo: "Meta de receita mensal", tipo: "moeda", min: 0 },
    { nome: "pro_labore", rotulo: "Pró-labore", tipo: "moeda", min: 0, ajuda: "Retirada mensal combinada." },
    {
      nome: "reserva_minima",
      rotulo: "Reserva mínima",
      tipo: "moeda",
      min: 0,
      ajuda: "Abaixo deste saldo, acenda o alerta.",
    },
  ],
  colecoes: [
    {
      nome: "lancamentos",
      rotulo: "Lançamentos",
      rotuloItem: "Lançamento",
      campoTitulo: "descricao",
      campoSubtitulo: "data",
      campoDestaque: "status",
      ordenarPor: { campo: "data", direcao: "desc" },
      campos: [
        { nome: "data", rotulo: "Data", tipo: "data", obrigatorio: true },
        { nome: "descricao", rotulo: "Descrição", tipo: "texto-curto", obrigatorio: true },
        {
          nome: "tipo",
          rotulo: "Tipo",
          tipo: "selecao",
          obrigatorio: true,
          opcoes: [
            { valor: "entrada", rotulo: "Entrada" },
            { valor: "saida", rotulo: "Saída" },
          ],
        },
        { nome: "valor", rotulo: "Valor", tipo: "moeda", min: 0, obrigatorio: true },
        {
          nome: "categoria",
          rotulo: "Categoria",
          tipo: "selecao",
          opcoes: [
            { valor: "receita-de-vendas", rotulo: "Receita de vendas" },
            { valor: "outras-receitas", rotulo: "Outras receitas" },
            { valor: "pro-labore", rotulo: "Pró-labore" },
            { valor: "impostos", rotulo: "Impostos" },
            { valor: "ferramentas", rotulo: "Ferramentas" },
            { valor: "marketing", rotulo: "Marketing" },
            { valor: "fornecedores", rotulo: "Fornecedores" },
            { valor: "pessoal", rotulo: "Pessoal" },
            { valor: "outros", rotulo: "Outros" },
          ],
        },
        {
          nome: "recorrencia",
          rotulo: "Recorrência",
          tipo: "selecao",
          opcoes: [
            { valor: "unica", rotulo: "Única" },
            { valor: "mensal", rotulo: "Mensal" },
            { valor: "anual", rotulo: "Anual" },
          ],
        },
        {
          nome: "status",
          rotulo: "Situação",
          tipo: "selecao",
          opcoes: [
            { valor: "previsto", rotulo: "Previsto" },
            { valor: "realizado", rotulo: "Realizado" },
          ],
        },
      ],
      resumos: [
        {
          tipo: "saldo",
          rotulo: "Saldo realizado",
          campo: "valor",
          campoTipo: "tipo",
          entrada: "entrada",
          saida: "saida",
          campoBase: "saldo_inicial",
          filtro: { campo: "status", valor: "realizado" },
        },
        { tipo: "soma", rotulo: "Total de saídas", campo: "valor", filtro: { campo: "tipo", valor: "saida" } },
      ],
    },
  ],
}

/** Coleção "clientes" (atalho para stories de ItemCard/ItemForm/CollectionSection). */
export const colecaoClientes = defPrimeirosClientes.colecoes![0]
/** Coleção "lancamentos" do caixa (ordenada por data desc). */
export const colecaoLancamentos = defFluxoDeCaixa.colecoes![0]

// ---------------------------------------------------------------------------
// Documentos (exemplos da §3.8 + variações)
// ---------------------------------------------------------------------------

/** §3.8.2 — página com itens, atualizada por agente. */
export const docPrimeirosClientes: ContentDoc = {
  id: "validacao/primeiros-clientes",
  secao: "validacao",
  pagina: "primeiros-clientes",
  titulo: "Primeiros Clientes",
  descricao: "Os primeiros clientes e conversas de venda como evidência de validação.",
  estagio: "para-quem-esta-comecando",
  status: "em-validacao",
  atualizado_em: "2026-11-08T18:05:44.120Z",
  atualizado_por: "agente:estrategista",
  tags: [],
  relacionados: ["direcao/perfil-de-cliente-ideal", "validacao/oferta"],
  campos: {
    meta_de_clientes: 5,
    prazo_da_meta: "2026-12-15",
    roteiro_de_abordagem:
      "Mensagem no WhatsApp perguntando como ela controla o dinheiro do salão; se responder com dor, ofereço uma conversa de 20 minutos.",
    principais_aprendizados: ["Quem tem DAS atrasado fecha mais rápido"],
    objecoes_recorrentes: ["Já tenho contador"],
  },
  itens: [
    {
      id: "a1b2c3d4e5",
      colecao: "clientes",
      nome: "Ana Souza",
      contato: "@ana.nails",
      origem: "instagram",
      status: "fechado",
      valor: 197,
      proximo_passo: "Onboarding na segunda",
      aprendizado: "Fechou depois de ver o próprio DRE simplificado na call.",
    },
    {
      id: "f6e7d8c9b0",
      colecao: "clientes",
      nome: "Bruna Lima",
      contato: "(41) 99999-0000",
      origem: "indicacao",
      status: "proposta",
      valor: 197,
      proximo_passo: "Retornar na sexta",
      aprendizado: "",
    },
    {
      id: "0c9d8e7f6a",
      colecao: "clientes",
      nome: "Salão Bela Vida",
      contato: "",
      origem: "evento",
      status: "perdido",
      valor: null,
      proximo_passo: "",
      aprendizado: "Achou caro porque já paga contador; objeção de preço disfarçada.",
    },
  ],
  corpo:
    "## Notas\n\nDuas das três conversas começaram por indicação ou Instagram. Repetir o canal **Instagram** na próxima rodada.\n",
  extras: {},
}

/** Mesma página nunca editada (template). */
export const docPrimeirosClientesVazio: ContentDoc = {
  ...docPrimeirosClientes,
  status: "vazio",
  atualizado_em: DATA_EPOCA_FIXTURE,
  atualizado_por: "humano",
  campos: {
    meta_de_clientes: null,
    prazo_da_meta: null,
    roteiro_de_abordagem: "",
    principais_aprendizados: [],
    objecoes_recorrentes: [],
  },
  itens: [],
  corpo: "",
}

/** Versão "do servidor" alterada por um agente (para a story de conflito). */
export const docPrimeirosClientesAlteradoPorAgente: ContentDoc = {
  ...docPrimeirosClientes,
  atualizado_em: "2026-11-08T19:12:03.000Z",
  atualizado_por: "agente:estrategista",
  campos: { ...docPrimeirosClientes.campos, objecoes_recorrentes: ["Já tenho contador", "Agora não é hora"] },
}

/** §3.8.1 — página só com campos, editada por humano. */
export const docPerfilClienteIdeal: ContentDoc = {
  id: "direcao/perfil-de-cliente-ideal",
  secao: "direcao",
  pagina: "perfil-de-cliente-ideal",
  titulo: "Perfil de Cliente Ideal",
  descricao: "Quem mais sente o problema escolhido e como essa pessoa decide comprar.",
  estagio: "para-quem-esta-comecando",
  status: "rascunho",
  atualizado_em: "2026-11-08T14:32:10.000Z",
  atualizado_por: "humano",
  tags: ["mei", "servicos"],
  relacionados: ["direcao/ima-de-problemas", "direcao/tese-de-valor"],
  campos: {
    quem_e:
      "Carla, 34 anos, manicure MEI em Curitiba. Atende 6 clientes por dia, recebe tudo no Pix pessoal e no fim do mês não sabe se teve lucro.",
    dados_demograficos: [
      "28 a 45 anos",
      "MEI prestadora de serviço (beleza e bem-estar)",
      "Fatura de R$ 4 mil a R$ 8 mil por mês",
      "Capitais e regiões metropolitanas do Sul e Sudeste",
    ],
    dores: [
      "Mistura conta pessoal e da empresa",
      "Não sabe quanto pode retirar por mês",
      "Medo de cair na malha fina ou estourar o limite do MEI",
    ],
    desejos: ["Saber quanto lucrou no mês em 5 minutos", "Pagar o DAS em dia sem lembrar disso"],
    onde_esta: [
      "Instagram (perfis de gestão para salões)",
      "Grupos de WhatsApp de profissionais da beleza",
      "Feiras do setor",
    ],
    gatilhos_de_compra: ["Mês em que faltou dinheiro para pagar um fornecedor", "Aviso de DAS atrasado"],
    objecoes: ["Não tenho tempo para planilha", "Meu contador já resolve isso"],
    quanto_paga_hoje: 89,
  },
  itens: [
    {
      id: "p1a2b3c4d5",
      colecao: "personas",
      nome: "O Dono-Fundador",
      arquetipo: "dono de indústria que decide sozinho e quer a marca à altura do produto",
      perfil: "Dono, sócio ou CEO de indústria de R$ 1,5 a 50 mi; fábrica própria, vende por varejo e representantes (hipótese)",
      psicografia: "Identidade forte no produto e na fábrica, fraca em marca.",
      momento:
        "A empresa cresceu mais rápido que a marca: embalagem, catálogo e redes sociais parecem de empresas diferentes. Quer ser reconhecido como marca, não só como fornecedor ou fábrica.",
      contexto: "Ambiente: fábrica, representantes, gráficas de embalagem e feiras do setor.",
      gatilhos: [
        "Lançamento de linha ou de produto novo (SKU), com embalagem e material de venda para refazer",
        "Entrada em um novo canal: rede varejista, distribuidor ou marketplace",
        "Concorrente que redesenhou a marca e passou a ocupar a gôndola ou o catálogo",
        "Indicação de alguém de confiança: agência parceira, gráfica de embalagem ou contador",
        "Representante pedindo material novo",
      ],
    },
    {
      id: "p2b3c4d5e6",
      colecao: "personas",
      nome: "A Liderança de Marketing Enxuta",
      arquetipo: "quem mantém a marca com time de 1 a 5 pessoas e muita troca de gente",
      perfil: "Gerente, coordenador ou diretor de marketing de empresa de R$ 1,5 a 50 mi (hipótese)",
      psicografia: "Sobrecarregada, usa IA todo dia e se incomoda com o resultado genérico.",
      momento: "Gasta o tempo corrigindo material de agências e redatores em vez de pensar estratégia.",
      contexto: "Equipe pequena, alta rotatividade, agências com briefings diferentes.",
      gatilhos: ["Troca de pessoas no time de marketing", "Chegada de nova agência ou redator", "Uso de IA sem regras de marca"],
    },
    {
      id: "p3c4d5e6f7",
      colecao: "personas",
      nome: "A Liderança de Produto Digital",
      arquetipo: "time de SaaS que precisa da marca falando a mesma língua do produto",
      perfil: "Fundador, CMO ou head de design de SaaS (hipótese)",
      psicografia: "",
      momento: "",
      contexto: "",
      gatilhos: [],
    },
  ],
  corpo:
    "## Notas\n\n- Entrevistei 4 manicures; 3 usam o Pix pessoal para tudo.\n- Hipótese: o gatilho mais forte é o **DAS atrasado**, não o desejo de lucro.\n",
  extras: {},
}

/** Caixa com saldo negativo (resumo com sinal "−"). */
export const docFluxoDeCaixa: ContentDoc = {
  id: "caixa/fluxo-de-caixa",
  secao: "caixa",
  pagina: "fluxo-de-caixa",
  titulo: "Fluxo de Caixa",
  descricao: "A operação recorrente: entradas, saídas, saldo e projeção.",
  estagio: "para-quem-esta-comecando",
  status: "rascunho",
  atualizado_em: "2026-11-05T12:00:00.000Z",
  atualizado_por: "humano",
  tags: [],
  relacionados: ["caixa/erp", "founder/estilo-de-vida"],
  campos: {
    saldo_inicial: 800,
    data_do_saldo_inicial: "2026-11-01",
    custo_fixo_mensal: 450,
    meta_de_receita_mensal: 3000,
    pro_labore: 1500,
    reserva_minima: 500,
  },
  itens: [
    {
      id: "l1a2b3c4d5",
      colecao: "lancamentos",
      data: "2026-11-02",
      descricao: "Mensalidade Ana Souza",
      tipo: "entrada",
      valor: 197,
      categoria: "receita-de-vendas",
      recorrencia: "mensal",
      status: "realizado",
    },
    {
      id: "l2b3c4d5e6",
      colecao: "lancamentos",
      data: "2026-11-05",
      descricao: "Pró-labore de novembro",
      tipo: "saida",
      valor: 1500,
      categoria: "pro-labore",
      recorrencia: "mensal",
      status: "realizado",
    },
    {
      id: "l3c4d5e6f7",
      colecao: "lancamentos",
      data: "2026-11-10",
      descricao: "Assinatura do emissor de notas",
      tipo: "saida",
      valor: 39.9,
      categoria: "ferramentas",
      recorrencia: "mensal",
      status: "previsto",
    },
  ],
  corpo: "",
  extras: {},
}

// ---------------------------------------------------------------------------
// Resumos pré-calculados (como a página da Onda 3 entregará ao PageEditor)
// ---------------------------------------------------------------------------

export const resumosPrimeirosClientes: Record<string, ResumoCalculado[]> = {
  clientes: [
    { rotulo: "Clientes fechados", valor: 1, formato: "numero" },
    { rotulo: "Receita fechada", valor: 197, formato: "moeda" },
  ],
}

export const resumosFluxoDeCaixa: Record<string, ResumoCalculado[]> = {
  lancamentos: [
    { rotulo: "Saldo realizado", valor: -503, formato: "moeda" },
    { rotulo: "Total de saídas", valor: 1539.9, formato: "moeda" },
  ],
}

// ---------------------------------------------------------------------------
// Visão geral (sidebar, home e índices de seção)
// ---------------------------------------------------------------------------

/** Status de cada página para a sidebar e os cards. */
export const statusPorIdExemplo: Partial<Record<DocId, Status>> = {
  "founder/objetivo": "validado",
  "founder/estilo-de-vida": "rascunho",
  "direcao/mapa-de-mercado": "validado",
  "direcao/ima-de-problemas": "em-validacao",
  "direcao/perfil-de-cliente-ideal": "rascunho",
  "direcao/tese-de-valor": "vazio",
  "direcao/oferta": "vazio",
  "validacao/oferta": "rascunho",
  "validacao/primeiros-clientes": "em-validacao",
  "validacao/fluxo-de-caixa": "vazio",
  "caixa/fluxo-de-caixa": "rascunho",
  "caixa/erp": "vazio",
}

const COMPLETUDE_POR_STATUS: Record<Status, number> = {
  vazio: 0,
  rascunho: 43,
  "em-validacao": 75,
  validado: 100,
}

export interface PaginaResumoFixture {
  pagina: PaginaNav
  href: string
  status: Status
  completude: number
  atualizadoEm: string
}

/** Páginas de uma seção já com status/completude/data (formato das props do SectionCard). */
export function paginasDaSecao(
  secao: SecaoNav,
  statusPorId: Partial<Record<DocId, Status>> = statusPorIdExemplo,
): PaginaResumoFixture[] {
  return secao.paginas.map((pagina) => {
    const id = `${secao.slug}/${pagina.slug}` as DocId
    const status = statusPorId[id] ?? "vazio"
    return {
      pagina,
      href: hrefDoDocumento(id),
      status,
      completude: COMPLETUDE_POR_STATUS[status],
      atualizadoEm: status === "vazio" ? DATA_EPOCA_FIXTURE : "2026-11-07T21:40:00.000Z",
    }
  })
}

/** As 4 seções da navegação. */
export const secoesExemplo: readonly SecaoNav[] = NAVEGACAO
