// scripts/seed-conteudo.ts
// Cria em content/ os arquivos que ainda não existem, a partir do template de cada página.
// Nunca sobrescreve um arquivo existente. Uso: npm run content:seed
import { DOC_IDS } from "@/lib/content/navigation";
import { FileSystemContentRepository } from "@/lib/content/fs-repository";
import { criarTemplate } from "@/lib/content/schemas/build";
import { obterDefinicao } from "@/lib/content/schemas";

async function main(): Promise<void> {
  const repo = new FileSystemContentRepository();
  let criados = 0;
  for (const id of DOC_IDS) {
    if (await repo.existe(id)) {
      process.stdout.write(`  mantido  content/${id}.md\n`);
      continue;
    }
    await repo.save(criarTemplate(obterDefinicao(id)));
    criados += 1;
    process.stdout.write(`  criado   content/${id}.md\n`);
  }
  process.stdout.write(`\n${criados} arquivo(s) criado(s), ${DOC_IDS.length - criados} já existia(m). Pasta: ${repo.raiz}\n`);
}

main().catch((erro: unknown) => {
  console.error("Falha ao criar o conteúdo inicial:", erro);
  process.exit(1);
});
