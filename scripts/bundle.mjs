import { build } from 'esbuild';
import { readdir, readFile, unlink } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const entries = packageJson.n8n.nodes;
const sharedModules = [
  { source: 'nodes/DiscordClient.ts', outfile: 'dist/nodes/DiscordClient.js', external: [] },
  { source: 'nodes/DiscordGateway.ts', outfile: 'dist/nodes/DiscordGateway.js', external: ['./DiscordClient'] },
];
const sharedExternals = ['*/DiscordGateway', '*/DiscordClient'];

await Promise.all(
  entries.map(async (entry) =>
  {
    await build({
      bundle: true,
      entryPoints: [entry.replace(/^dist\//, '').replace(/\.js$/, '.ts')],
      external: ['n8n-workflow', ...sharedExternals],
      format: 'cjs',
      allowOverwrite: true,
      outfile: entry,
      platform: 'node',
      metafile: true,
      treeShaking: true,
      splitting: false,
      sourcemap: false,
      target: 'node18',
    });
  }),
);

for (const { source, outfile, external } of sharedModules)
{
  await build({
    bundle: true,
    entryPoints: [source],
    external: ['n8n-workflow', ...external],
    format: 'cjs',
    allowOverwrite: true,
    outfile,
    platform: 'node',
    metafile: true,
    treeShaking: true,
    splitting: false,
    sourcemap: false,
    target: 'node18',
  });
}

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
