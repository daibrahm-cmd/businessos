import type { NextConfig } from "next";

// Fase 1: renderização dinâmica (as páginas leem os arquivos de content/ a cada requisição).
// Sem cacheComponents/PPR (§1.2): as rotas do grupo (app) usam `dynamic = "force-dynamic"`.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
