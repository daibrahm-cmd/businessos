// src/lib/content/schemas/paginas/direcao-perfil-de-cliente-ideal.ts
// Definição da página Direção / Perfil de Cliente Ideal.
import { definirPagina } from "../definir-pagina";

export default definirPagina("direcao/perfil-de-cliente-ideal", {
  relacionadosPadrao: ["direcao/ima-de-problemas", "direcao/tese-de-valor"],
  placeholderNotas: "Registre entrevistas, padrões que você percebeu e hipóteses sobre o cliente.",
  campos: [
    { nome: "quem_e", rotulo: "Quem é", tipo: "texto-longo",
      ajuda: "Descreva uma pessoa (ou empresa) específica, como se fosse real." },
    { nome: "dados_demograficos", rotulo: "Dados demográficos", tipo: "lista-texto",
      ajuda: "Idade, renda, profissão, região, tamanho da empresa." },
    { nome: "dores", rotulo: "Dores", tipo: "lista-texto", ajuda: "O que incomoda, custa caro ou tira o sono." },
    { nome: "desejos", rotulo: "Desejos", tipo: "lista-texto", ajuda: "O resultado que ela quer, nas palavras dela." },
    { nome: "onde_esta", rotulo: "Onde está", tipo: "lista-texto",
      ajuda: "Canais, comunidades, eventos e perfis que acompanha." },
    { nome: "gatilhos_de_compra", rotulo: "Gatilhos de compra", tipo: "lista-texto",
      ajuda: "Eventos que fazem a pessoa procurar uma solução agora." },
    { nome: "objecoes", rotulo: "Objeções", tipo: "lista-texto", ajuda: "Por que ela diria \"não\" ou \"agora não\"." },
    { nome: "quanto_paga_hoje", rotulo: "Quanto paga hoje", tipo: "moeda", min: 0,
      ajuda: "Gasto mensal atual com alternativas ao seu produto." },
  ],
});
