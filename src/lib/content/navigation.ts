// src/lib/content/navigation.ts
// Fonte única da navegação do BusinessOS: estágio, seções, páginas, ordem e ícones.
// Toda validação de id (rotas, API, repositório) passa por aqui.

/** Estágios do negócio. Na Fase 1 existe apenas um. */
export const ESTAGIOS = ["para-quem-esta-comecando"] as const;
export type Estagio = (typeof ESTAGIOS)[number];
export const ESTAGIO_ATUAL: Estagio = "para-quem-esta-comecando";
export const ROTULO_ESTAGIO: Record<Estagio, string> = {
  "para-quem-esta-comecando": "Para quem está começando",
};

/** Nomes de ícones (mapeados para lucide-react em src/components/layout/icones.ts). */
export type NomeIcone =
  | "target"
  | "sun"
  | "map"
  | "magnet"
  | "user-round"
  | "lightbulb"
  | "package"
  | "flask-conical"
  | "users"
  | "piggy-bank"
  | "wallet"
  | "workflow";

export interface PaginaNav {
  slug: string;
  titulo: string;
  descricao: string;
  icone: NomeIcone;
}

export interface SecaoNav {
  slug: string;
  /** Título exibido na sidebar (caixa alta). */
  titulo: string;
  /** Nome em texto corrido (breadcrumb, títulos). */
  nome: string;
  descricao: string;
  paginas: readonly PaginaNav[];
}

export const NAVEGACAO = [
  {
    slug: "founder",
    titulo: "FOUNDER",
    nome: "Founder",
    descricao: "Quem você é, o que quer e quanto pode investir de tempo e dinheiro.",
    paginas: [
      {
        slug: "objetivo",
        titulo: "Objetivo",
        descricao: "Por que este negócio existe para você e o que precisa ser verdade em 12 meses.",
        icone: "target",
      },
      {
        slug: "estilo-de-vida",
        titulo: "Estilo de Vida",
        descricao: "As restrições e preferências pessoais que o negócio precisa respeitar.",
        icone: "sun",
      },
    ],
  },
  {
    slug: "direcao",
    titulo: "DIREÇÃO",
    nome: "Direção",
    descricao: "Para onde o negócio vai: mercado, problema, cliente, tese e oferta.",
    paginas: [
      {
        slug: "mapa-de-mercado",
        titulo: "Mapa de Mercado",
        descricao: "O terreno onde você vai jogar: segmentos, concorrentes e espaços livres.",
        icone: "map",
      },
      {
        slug: "ima-de-problemas",
        titulo: "Imã de Problemas",
        descricao: "Problemas reais, frequentes e caros que atraem clientes dispostos a pagar.",
        icone: "magnet",
      },
      {
        slug: "perfil-de-cliente-ideal",
        titulo: "Perfil de Cliente Ideal",
        descricao: "Quem mais sente o problema escolhido e como essa pessoa decide comprar.",
        icone: "user-round",
      },
      {
        slug: "tese-de-valor",
        titulo: "Tese de Valor",
        descricao: "A hipótese central: por que este cliente escolheria você em vez das alternativas.",
        icone: "lightbulb",
      },
      {
        slug: "oferta",
        titulo: "Oferta",
        descricao: "O que será vendido, para quem, por quanto e em quais condições.",
        icone: "package",
      },
    ],
  },
  {
    slug: "validacao",
    titulo: "VALIDAÇÃO",
    nome: "Validação",
    descricao: "Testar a oferta com clientes reais gastando o mínimo.",
    paginas: [
      {
        slug: "oferta",
        titulo: "Oferta",
        descricao: "A oferta testada no mercado, o critério de sucesso e o que mudou a cada rodada.",
        icone: "flask-conical",
      },
      {
        slug: "primeiros-clientes",
        titulo: "Primeiros Clientes",
        descricao: "Os primeiros clientes e conversas de venda como evidência de validação.",
        icone: "users",
      },
      {
        slug: "fluxo-de-caixa",
        titulo: "Fluxo de Caixa",
        descricao: "O caixa mínimo do período de teste: quanto gastar e quando parar.",
        icone: "piggy-bank",
      },
    ],
  },
  {
    slug: "caixa",
    titulo: "CAIXA",
    nome: "Caixa",
    descricao: "A operação recorrente: dinheiro entrando, saindo e os processos que sustentam isso.",
    paginas: [
      {
        slug: "fluxo-de-caixa",
        titulo: "Fluxo de Caixa",
        descricao: "A operação recorrente: entradas, saídas, saldo e projeção.",
        icone: "wallet",
      },
      {
        slug: "erp",
        titulo: "ERP",
        descricao: "A base operacional: sistemas, processos e controles para operar e faturar.",
        icone: "workflow",
      },
    ],
  },
] as const satisfies readonly SecaoNav[];

// ---------- Tipos derivados ----------
export type Navegacao = typeof NAVEGACAO;
export type SecaoSlug = Navegacao[number]["slug"];
export type PaginaSlug<S extends SecaoSlug = SecaoSlug> = Extract<
  Navegacao[number],
  { slug: S }
>["paginas"][number]["slug"];
/** Id de documento: "<secao>/<pagina>", ex.: "direcao/oferta". */
export type DocId = { [S in SecaoSlug]: `${S}/${PaginaSlug<S>}` }[SecaoSlug];

// ---------- Índices e helpers ----------
/** Todos os ids, na ordem da navegação. */
export const DOC_IDS: readonly DocId[] = NAVEGACAO.flatMap((s) =>
  s.paginas.map((p) => `${s.slug}/${p.slug}` as DocId),
);

const IDS = new Set<string>(DOC_IDS);
const SECOES = new Set<string>(NAVEGACAO.map((s) => s.slug));

export function ehIdValido(valor: unknown): valor is DocId {
  return typeof valor === "string" && IDS.has(valor);
}

export function ehSecaoValida(valor: unknown): valor is SecaoSlug {
  return typeof valor === "string" && SECOES.has(valor);
}

/** Monta e valida um id a partir dos segmentos da URL. Retorna null se não existir. */
export function montarId(secao: string, pagina: string): DocId | null {
  const id = `${secao}/${pagina}`;
  return ehIdValido(id) ? id : null;
}

export function separarId(id: DocId): { secao: SecaoSlug; pagina: string } {
  const [secao, pagina] = id.split("/") as [SecaoSlug, string];
  return { secao, pagina };
}

export function obterSecao(slug: string): SecaoNav | undefined {
  return NAVEGACAO.find((s) => s.slug === slug);
}

export function obterPagina(id: DocId): { secao: SecaoNav; pagina: PaginaNav } {
  const { secao, pagina } = separarId(id);
  const s = obterSecao(secao)!;
  return { secao: s, pagina: s.paginas.find((p) => p.slug === pagina)! };
}

export function hrefDoDocumento(id: DocId): `/${string}` {
  return `/${id}`;
}

export function hrefDaSecao(slug: SecaoSlug): `/${string}` {
  return `/${slug}`;
}
