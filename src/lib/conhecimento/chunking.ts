// Divide o texto de um documento em trechos de ~800 caracteres, respeitando parágrafos,
// com sobreposição entre trechos vizinhos para não perder o contexto na fronteira.

export const TAMANHO_TRECHO = 800
export const SOBREPOSICAO = 120

interface OpcoesChunking {
  tamanho?: number
  sobreposicao?: number
}

/** Quebra um parágrafo maior que o limite em pedaços, preferindo cortar em espaço. */
function quebrarParagrafo(texto: string, tamanho: number): string[] {
  const partes: string[] = []
  let resto = texto
  while (resto.length > tamanho) {
    let corte = resto.lastIndexOf(" ", tamanho)
    if (corte < tamanho / 2) corte = tamanho
    partes.push(resto.slice(0, corte).trim())
    resto = resto.slice(corte).trim()
  }
  if (resto) partes.push(resto)
  return partes
}

/** Final do trecho anterior, a partir de um limite de palavra, usado como início do próximo. */
function cauda(texto: string, sobreposicao: number): string {
  if (sobreposicao <= 0 || texto.length <= sobreposicao) return sobreposicao > 0 ? texto : ""
  const inicio = texto.length - sobreposicao
  const espaco = texto.indexOf(" ", inicio)
  return (espaco === -1 ? texto.slice(inicio) : texto.slice(espaco + 1)).trim()
}

export function dividirEmTrechos(texto: string, { tamanho = TAMANHO_TRECHO, sobreposicao = SOBREPOSICAO }: OpcoesChunking = {}): string[] {
  const paragrafos = texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p) => (p.length > tamanho ? quebrarParagrafo(p, tamanho) : [p]))

  const trechos: string[] = []
  let atual = ""
  for (const p of paragrafos) {
    const junto = atual ? `${atual}\n\n${p}` : p
    if (junto.length <= tamanho || !atual) {
      atual = junto
      continue
    }
    trechos.push(atual)
    const comeco = cauda(atual, sobreposicao)
    // A sobreposição só entra se couber junto do parágrafo novo.
    atual = comeco && comeco.length + 2 + p.length <= tamanho ? `${comeco}\n\n${p}` : p
  }
  if (atual) trechos.push(atual)
  return trechos
}
