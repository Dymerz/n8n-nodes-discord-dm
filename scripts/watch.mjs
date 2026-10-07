import { spawn } from 'node:child_process';
import { build, context } from 'esbuild';

const entries = [
  'dist/nodes/triggers/DiscordDirectMessage.node.js',
  'dist/nodes/actions/DiscordSendDirectMessage.node.js',
  'dist/nodes/triggers/DiscordReactionAdded.node.js',
  'dist/nodes/triggers/DiscordReactionRemoved.node.js',
];

await new Promise((resolve, reject) => {
  const initialBuild = spawn('tsc', ['--pretty'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  initialBuild.once('error', reject);
  initialBuild.once('exit', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`TypeScript compilation failed with exit code ${code}`));
  });
});

const tsc = spawn('tsc', ['--watch', '--pretty'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const stop = () => {
  tsc.kill();
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

const contexts = await Promise.all(
  entries.map((entry) =>
    context({
      bundle: true,
      entryPoints: [entry],
      external: ['n8n-workflow'],
      format: 'cjs',
      allowOverwrite: true,
      outfile: entry,
      platform: 'node',
      sourcemap: true,
      target: 'node18',
    }),
  ),
);

await Promise.all(contexts.map((item) => item.watch()));
console.log('Watching TypeScript and bundled node output for changes.');
