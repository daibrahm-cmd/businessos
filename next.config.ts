import type { NextConfig } from "next";

// Fase 1: renderização dinâmica (as páginas leem os arquivos de content/ a cada requisição).
// Sem cacheComponents/PPR (§1.2): as rotas do grupo (app) usam `dynamic = "force-dynamic"`.
const nextConfig: NextConfig = {
  // Upload de arquivos (até 25 MB) passa por Server Action; o padrão do Next é 1 MB.
  // 30mb = 25 MB + folga do multipart (boundaries e cabeçalhos).
  experimental: {
    serverActions: { bodySizeLimit: "30mb" },
  },
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
