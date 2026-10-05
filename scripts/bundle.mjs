import { build } from 'esbuild';

const entries = [
  'dist/nodes/DiscordDirectMessage/DiscordDirectMessage.node.js',
  'dist/nodes/DiscordSendDirectMessage/DiscordSendDirectMessage.node.js',
  'dist/nodes/DiscordReactionAdded/DiscordReactionAdded.node.js',
  'dist/nodes/DiscordReactionRemoved/DiscordReactionRemoved.node.js',
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
