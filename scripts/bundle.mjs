import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const entries = packageJson.n8n.nodes;

await Promise.all(
  entries.map(async (entry) => {
    await build({
      bundle: true,
      entryPoints: [entry],
      external: ['n8n-workflow'],
      format: 'cjs',
      allowOverwrite: true,
      outfile: entry,
      platform: 'node',
      sourcemap: true,
      target: 'node18',
    });
  }),
);
