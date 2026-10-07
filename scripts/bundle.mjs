import { build } from 'esbuild';

const entries = [
  'dist/nodes/triggers/DiscordDirectMessage.node.js',
  'dist/nodes/actions/DiscordSendDirectMessage.node.js',
  'dist/nodes/triggers/DiscordReactionAdded.node.js',
  'dist/nodes/triggers/DiscordReactionRemoved.node.js',
];

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
