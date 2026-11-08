// src/lib/content/schemas/paginas/direcao-tese-de-valor.ts
// Definição da página Direção / Tese de Valor.
import { definirPagina, OPCOES_NIVEL } from "../definir-pagina";

export default definirPagina("direcao/tese-de-valor", {
  relacionadosPadrao: ["direcao/perfil-de-cliente-ideal", "direcao/ima-de-problemas", "direcao/oferta"],
  placeholderNotas: "Anote versões anteriores da tese, sugestões de agentes e o que ainda falta provar.",
  campos: [
    // ── A tese ───────────────────────────────────────────────────────────────
    { nome: "proposta_de_valor", rotulo: "Proposta de valor", tipo: "texto-longo", grupo: "A tese",
      placeholder: "Para [cliente] que [dor], [solução] entrega [resultado], diferente de [alternativa]." },
    { nome: "resultado_prometido", rotulo: "Resultado prometido", tipo: "texto-curto", grupo: "A tese",
      ajuda: "O resultado concreto que o cliente leva." },
    { nome: "prazo_do_resultado", rotulo: "Em quanto tempo ele chega", tipo: "texto-curto", grupo: "A tese",
      placeholder: "Ex.: em 30 dias" },
    { nome: "como_funciona", rotulo: "Como funciona (em poucas frases)", tipo: "texto-longo", grupo: "A tese",
      ajuda: "O mecanismo: por que esse jeito de resolver funciona." },

    // ── Diferenciação ────────────────────────────────────────────────────────
    { nome: "alternativa_substituida", rotulo: "Alternativa que você substitui", tipo: "texto-curto", grupo: "Diferenciação",
      ajuda: "O que o cliente deixa de usar ao escolher você." },
    { nome: "diferenciais", rotulo: "Diferenciais", tipo: "lista-texto", grupo: "Diferenciação" },
    { nome: "vantagem_injusta", rotulo: "Por que você", tipo: "texto-longo", grupo: "Diferenciação",
      ajuda: "O que você tem que é difícil de copiar." },
    { nome: "prova_de_credibilidade", rotulo: "Provas de credibilidade", tipo: "lista-texto", grupo: "Diferenciação",
      ajuda: "Resultados, cases, certificações, números que sustentam a promessa." },
    { nome: "o_que_nao_oferece", rotulo: "O que você NÃO faz", tipo: "lista-texto", grupo: "Diferenciação",
      ajuda: "Limites claros da tese: ajudam a focar e a filtrar clientes." },

    // ── Riscos e confiança ───────────────────────────────────────────────────
    { nome: "hipoteses_criticas", rotulo: "Hipóteses críticas", tipo: "lista-texto", grupo: "Riscos e confiança",
      ajuda: "O que precisa ser verdade para a tese se sustentar (vão para a Validação)." },
    { nome: "como_testar", rotulo: "Como testar a hipótese mais arriscada", tipo: "texto-longo", grupo: "Riscos e confiança" },
    { nome: "o_que_derruba_a_tese", rotulo: "O que derrubaria a tese", tipo: "texto-longo", grupo: "Riscos e confiança",
      ajuda: "Um fato que, se aparecer, mostra que está errada." },
    { nome: "nivel_de_confianca", rotulo: "Nível de confiança", tipo: "selecao", opcoes: OPCOES_NIVEL, grupo: "Riscos e confiança" },
  ],
});
