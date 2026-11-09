// src/lib/markdown/notas.ts
// Lê as notas (Markdown livre) e reconhece a estrutura usada pelos agentes:
//   ## Sugestão da <agente> (dd/mm)   → uma entrada
//   Texto terminado em ":"            → um grupo
//   - Rótulo: texto                   → um item (rótulo opcional)
// Sem essa estrutura devolve null e a tela mostra o Markdown como texto corrido.
// Limite: é heurístico. "Alerta" = item que termina em "?" ou contém "atualizar".

export interface ItemNota {
  rotulo: string | null;
  /** Texto do item com a formatação inline (**negrito**) preservada. */
  texto: string;
  alerta: boolean;
}

export interface GrupoNota {
  titulo: string;
  itens: ItemNota[];
}

/** Número em negrito de um item, mostrado como cartão grande. */
export interface DestaqueNota {
  rotulo: string;
  valor: string;
  legenda: string;
}

/** Tabela em Markdown (linhas "| a | b |"): a primeira linha é o cabeçalho. */
export interface TabelaNota {
  cabecalho: string[];
  linhas: string[][];
}

export interface EntradaNota {
  titulo: string | null;
  autor: string | null;
  data: string | null;
  introducao: string[];
  grupos: GrupoNota[];
  destaques: DestaqueNota[];
  tabelas: TabelaNota[];
  /** true quando a entrada (ou a seção "##" em que está) foi marcada como [SEGUNDO PLANO] (ou [DESCARTADA], marcador antigo). */
  segundoPlano?: boolean;
}

const RE_LINHA_TABELA = /^\s*\|.*\|\s*$/;
const RE_SEPARADOR_TABELA = /^\s*\|[\s:|-]+\|\s*$/;
const celulas = (linha: string) => linha.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const RE_TITULO = /^(#{1,3})\s+(.*)$/;
const RE_ITEM = /^\s*[-*]\s+(.*)$/;
const RE_ROTULO = /^([^:*]{1,40}):\s+([\s\S]+)$/; // [\s\S] aceita quebras de linha
// Linha recuada com "=" logo após um item é uma conta: vira uma linha própria dentro do item (separada por "\n")
const RE_CONTA = /^\s{2,}\S.*=/;
const RE_AUTOR_DATA = /\bd[ao]s?\s+([a-z0-9][a-z0-9-]*)\s*\((\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\)/i;
const RE_NEGRITO = /\*\*([^*]+)\*\*/;
/** Marcador de segundo plano no título: "[SEGUNDO PLANO: motivo]" (aceita também o antigo "[DESCARTADA…]"). */
export const RE_SEGUNDO_PLANO = /SEGUNDO PLANO|DESCARTAD[AO]/i;
const MAX_DESTAQUES = 3;
const MAX_LEGENDA = 100;

const semMarcacao = (texto: string) => texto.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");

function novaEntrada(titulo: string | null): EntradaNota {
  const m = titulo ? RE_AUTOR_DATA.exec(titulo) : null;
  return { titulo, autor: m?.[1] ?? null, data: m?.[2] ?? null, introducao: [], grupos: [], destaques: [], tabelas: [] };
}

/** Primeira letra maiúscula (sem mexer em "**" nem em números), para a frase que perdeu o rótulo. */
const capitalizar = (t: string) => t.replace(/^(\*\*)?(\p{Ll})/u, (_, negrito = "", letra) => negrito + letra.toUpperCase());

function criarItem(bruto: string): ItemNota {
  const m = RE_ROTULO.exec(bruto.trim());
  const texto = m ? capitalizar(m[2].trim()) : bruto.trim();
  return {
    rotulo: m ? m[1].trim() : null,
    texto,
    alerta: texto.endsWith("?") || /\batualizar\b/i.test(texto),
  };
}

function calcularDestaques(entrada: EntradaNota): DestaqueNota[] {
  const destaques: DestaqueNota[] = [];
  for (const grupo of entrada.grupos) {
    for (const item of grupo.itens) {
      const negrito = RE_NEGRITO.exec(item.texto);
      if (!negrito || destaques.length >= MAX_DESTAQUES) continue;
      // A legenda usa só a primeira linha do item; as contas (linhas seguintes) aparecem no cartão do grupo
      const legenda = semMarcacao(item.texto.split("\n")[0]);
      destaques.push({
        rotulo: item.rotulo ?? "Destaque",
        valor: negrito[1].trim(),
        legenda: legenda.length > MAX_LEGENDA ? `${legenda.slice(0, MAX_LEGENDA).trimEnd()}…` : legenda,
      });
    }
  }
  return destaques;
}

/** Entradas reconhecidas nas notas, ou null se o texto não tem a estrutura esperada. */
export function analisarNotas(md: string): EntradaNota[] | null {
  const entradas: EntradaNota[] = [];
  let atual: EntradaNota | null = null;
  let grupo: GrupoNota | null = null;
  let ultimoItem: ItemNota | null = null;
  let tabela: TabelaNota | null = null;
  let paiEmSegundoPlano = false;

  const fechar = () => {
    if (atual && (atual.titulo || atual.grupos.length > 0 || atual.introducao.length > 0 || atual.tabelas.length > 0)) entradas.push(atual);
    atual = null;
    grupo = null;
    ultimoItem = null;
    tabela = null;
  };
  const garantirEntrada = (): EntradaNota => (atual ??= novaEntrada(null));
  const garantirGrupo = (titulo: string): GrupoNota => {
    if (!grupo) {
      grupo = { titulo, itens: [] };
      garantirEntrada().grupos.push(grupo);
    }
    return grupo;
  };

  for (const linha of md.replace(/\r\n?/g, "\n").split("\n")) {
    if (linha.trim() === "") {
      ultimoItem = null;
      continue;
    }
    if (RE_LINHA_TABELA.test(linha)) {
      // Tabela: separador "|---|" só marca o fim do cabeçalho; a primeira linha vira cabeçalho
      ultimoItem = null;
      if (RE_SEPARADOR_TABELA.test(linha)) continue;
      if (!tabela) {
        tabela = { cabecalho: celulas(linha), linhas: [] };
        garantirEntrada().tabelas.push(tabela);
      } else {
        tabela.linhas.push(celulas(linha));
      }
      continue;
    }
    tabela = null;
    const titulo = RE_TITULO.exec(linha);
    if (titulo) {
      fechar();
      atual = novaEntrada(titulo[2].trim());
      // Subtítulo "###" herda o segundo plano da seção "##" em que está; "##" ou "#" redefine
      if (titulo[1].length < 3) paiEmSegundoPlano = RE_SEGUNDO_PLANO.test(titulo[2]);
      if (RE_SEGUNDO_PLANO.test(titulo[2]) || (titulo[1].length === 3 && paiEmSegundoPlano)) atual.segundoPlano = true;
      continue;
    }
    const item = RE_ITEM.exec(linha);
    if (item) {
      const novo = criarItem(item[1]);
      garantirGrupo("Itens").itens.push(novo);
      ultimoItem = novo;
      continue;
    }
    const texto = linha.trim();
    if (ultimoItem) {
      // Linha logo após um item continua o mesmo item (igual ao renderizador de Markdown);
      // uma conta recuada ("  a × b = c") fica em linha própria, para ser exibida como cálculo
      const sep = RE_CONTA.test(linha) ? "\n" : " ";
      const base = ultimoItem.rotulo ? `${ultimoItem.rotulo}: ${ultimoItem.texto}${sep}${texto}` : `${ultimoItem.texto}${sep}${texto}`;
      Object.assign(ultimoItem, criarItem(base));
    } else if (texto.endsWith(":")) {
      grupo = { titulo: texto.slice(0, -1).trim(), itens: [] };
      garantirEntrada().grupos.push(grupo);
    } else if (!grupo) {
      garantirEntrada().introducao.push(texto);
    } else {
      grupo.itens.push({ rotulo: null, texto, alerta: false });
    }
  }
  fechar();

  if (!entradas.some((e) => e.grupos.some((g) => g.itens.length > 0))) return null;
  for (const e of entradas) e.destaques = calcularDestaques(e);
  return entradas;
}
