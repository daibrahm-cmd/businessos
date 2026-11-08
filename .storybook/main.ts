import type { StorybookConfig } from "@storybook/nextjs-vite"
import tailwindcss from "@tailwindcss/vite"

const config: StorybookConfig = {
  // Stories ficam ao lado dos componentes (ex.: src/components/ui/button.stories.tsx)
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-themes"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  // O Next usa @tailwindcss/turbopack (sem PostCSS); no Vite do Storybook
  // o Tailwind v4 entra pelo plugin oficial @tailwindcss/vite.
  async viteFinal(viteConfig) {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()]
    return viteConfig
  },
}

export default config
