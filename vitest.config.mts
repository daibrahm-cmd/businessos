// vitest.config.mts (extensão .mts: carregado como ESM, sem aviso de CommonJS do Vite)
// Testes unitários e de integração (ambiente node) da camada de conteúdo, da API e dos scripts.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
        },
      },
    ],
  },
});
