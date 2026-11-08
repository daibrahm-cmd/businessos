// src/lib/content/schemas/paginas/direcao-perfil-de-cliente-ideal.ts
// Definição da página Direção / Perfil de Cliente Ideal.
import { definirPagina } from "../definir-pagina";

export default definirPagina("direcao/perfil-de-cliente-ideal", {
  relacionadosPadrao: ["direcao/ima-de-problemas", "direcao/tese-de-valor"],
  placeholderNotas: "Registre entrevistas, padrões que você percebeu e hipóteses sobre o cliente.",
  campos: [
    // ── Quem é ───────────────────────────────────────────────────────────────
    { nome: "quem_e", rotulo: "Quem é", tipo: "texto-longo", grupo: "Quem é",
      ajuda: "Descreva uma pessoa (ou empresa) específica, como se fosse real." },
    { nome: "tipo_de_cliente", rotulo: "Pessoa ou empresa", tipo: "selecao", grupo: "Quem é", opcoes: [
      { valor: "pessoa", rotulo: "Pessoa física (B2C)" },
      { valor: "empresa", rotulo: "Empresa (B2B)" },
      { valor: "ambos", rotulo: "Ambos" },
    ] },
    { nome: "dados_demograficos", rotulo: "Dados demográficos", tipo: "lista-texto", grupo: "Quem é",
      ajuda: "Idade, renda, profissão, região, tamanho da empresa." },
    { nome: "cargo_ou_papel", rotulo: "Cargo ou papel", tipo: "texto-curto", grupo: "Quem é",
      placeholder: "Ex.: dona do negócio, gerente financeiro" },
    { nome: "rotina_do_cliente", rotulo: "Um dia na vida dele(a)", tipo: "texto-longo", grupo: "Quem é" },

    // ── O que sente e quer ───────────────────────────────────────────────────
    { nome: "dores", rotulo: "Dores", tipo: "lista-texto", grupo: "Dores e desejos", ajuda: "O que incomoda, custa caro ou tira o sono." },
    { nome: "desejos", rotulo: "Desejos", tipo: "lista-texto", grupo: "Dores e desejos", ajuda: "O resultado que ela quer, nas palavras dela." },
    { nome: "o_que_ja_tentou", rotulo: "O que já tentou", tipo: "lista-texto", grupo: "Dores e desejos" },
    { nome: "o_que_valoriza", rotulo: "O que mais valoriza em uma solução", tipo: "lista-texto", grupo: "Dores e desejos",
      ajuda: "Preço, rapidez, confiança, atendimento, resultado garantido…" },

    // ── Como compra ──────────────────────────────────────────────────────────
    { nome: "onde_esta", rotulo: "Onde está", tipo: "lista-texto", grupo: "Como compra",
      ajuda: "Canais, comunidades, eventos e perfis que acompanha." },
    { nome: "gatilhos_de_compra", rotulo: "Gatilhos de compra", tipo: "lista-texto", grupo: "Como compra",
      ajuda: "Eventos que fazem a pessoa procurar uma solução agora." },
    { nome: "quem_decide", rotulo: "Quem decide a compra", tipo: "texto-curto", grupo: "Como compra",
      placeholder: "Ex.: a própria pessoa; o sócio financeiro" },
    { nome: "tempo_de_decisao", rotulo: "Tempo até decidir", tipo: "texto-curto", grupo: "Como compra",
      placeholder: "Ex.: no mesmo dia; 2 semanas" },
    { nome: "objecoes", rotulo: "Objeções", tipo: "lista-texto", grupo: "Como compra", ajuda: "Por que ela diria \"não\" ou \"agora não\"." },
    { nome: "quanto_paga_hoje", rotulo: "Quanto paga hoje", tipo: "moeda", min: 0, grupo: "Como compra",
      ajuda: "Gasto mensal atual com alternativas ao seu produto." },
    { nome: "quem_nao_e_cliente", rotulo: "Quem NÃO é seu cliente", tipo: "texto-longo", grupo: "Como compra",
      ajuda: "Perfis parecidos que dão trabalho e não compram." },
  ],
});
