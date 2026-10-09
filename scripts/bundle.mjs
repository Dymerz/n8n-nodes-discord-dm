import { build } from 'esbuild';
import { readdir, readFile, unlink } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const entries = packageJson.n8n.nodes;
const sharedGateway = 'dist/nodes/triggers/DiscordGateway.js';
const sharedGatewaySource = 'nodes/triggers/DiscordGateway.ts';

await Promise.all(
  entries.map(async (entry) =>
  {
    await build({
      bundle: true,
      entryPoints: [entry.replace(/^dist\//, '').replace(/\.js$/, '.ts')],
      external: ['n8n-workflow', './DiscordGateway', '../triggers/DiscordGateway'],
      format: 'cjs',
      allowOverwrite: true,
      outfile: entry,
      platform: 'node',
      sourcemap: false,
      target: 'node18',
    });
  }),
);

await build({
  bundle: true,
  entryPoints: [sharedGatewaySource],
  external: ['n8n-workflow'],
  format: 'cjs',
  allowOverwrite: true,
  outfile: sharedGateway,
  platform: 'node',
  sourcemap: false,
  target: 'node18',
});

async function removeUnpublishedArtifacts(directory)
{
  for (const entry of await readdir(directory, { withFileTypes: true }))
  {
    const entryPath = new URL(
      entry.isDirectory() ? `${entry.name}/` : entry.name,
      directory,
    );

    if (entry.isDirectory())
    {
      await removeUnpublishedArtifacts(entryPath);
    } else if (entry.name.endsWith('.map') || entry.name.endsWith('.d.ts'))
    {
      await unlink(entryPath);
    }
  }
}

await removeUnpublishedArtifacts(new URL('../dist/', import.meta.url));
