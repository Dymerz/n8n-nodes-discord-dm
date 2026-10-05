import { build } from 'esbuild';

const entries = [
  'dist/nodes/triggers/DiscordDirectMessage.trigger.js',
  'dist/nodes/actions/DiscordSendDirectMessage.node.js',
  'dist/nodes/triggers/DiscordReactionAdded.trigger.js',
  'dist/nodes/triggers/DiscordReactionRemoved.trigger.js',
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
