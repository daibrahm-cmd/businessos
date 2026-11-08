// src/lib/content/schemas/paginas/direcao-tese-de-valor.ts
// Definição da página Direção / Tese de Valor.
import { definirPagina, OPCOES_NIVEL } from "../definir-pagina";

export default definirPagina("direcao/tese-de-valor", {
  relacionadosPadrao: ["direcao/perfil-de-cliente-ideal", "direcao/ima-de-problemas", "direcao/oferta"],
  placeholderNotas: "Anote versões anteriores da tese, sugestões de agentes e o que ainda falta provar.",
  campos: [
    { nome: "proposta_de_valor", rotulo: "Proposta de valor", tipo: "texto-longo",
      placeholder: "Para [cliente] que [dor], [solução] entrega [resultado], diferente de [alternativa]." },
    { nome: "resultado_prometido", rotulo: "Resultado prometido", tipo: "texto-curto",
      ajuda: "O resultado concreto que o cliente leva." },
    { nome: "alternativa_substituida", rotulo: "Alternativa que você substitui", tipo: "texto-curto",
      ajuda: "O que o cliente deixa de usar ao escolher você." },
    { nome: "diferenciais", rotulo: "Diferenciais", tipo: "lista-texto" },
    { nome: "vantagem_injusta", rotulo: "Por que você", tipo: "texto-longo",
      ajuda: "O que você tem que é difícil de copiar." },
    { nome: "hipoteses_criticas", rotulo: "Hipóteses críticas", tipo: "lista-texto",
      ajuda: "O que precisa ser verdade para a tese se sustentar (vão para a Validação)." },
    { nome: "nivel_de_confianca", rotulo: "Nível de confiança", tipo: "selecao", opcoes: OPCOES_NIVEL },
  ],
});
