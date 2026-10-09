import { context } from 'esbuild';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const entries = packageJson.n8n.nodes;

await new Promise((resolve, reject) =>
{
  const initialBuild = spawn('tsc', ['--pretty'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  initialBuild.once('error', reject);
  initialBuild.once('exit', (code) =>
  {
    if (code === 0) resolve();
    else reject(new Error(`TypeScript compilation failed with exit code ${code}`));
  });
});

const tsc = spawn('tsc', ['--watch', '--pretty', '--noEmit'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const stop = () =>
{
  tsc.kill();
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

const contexts = await Promise.all(
  entries.map((entry) =>
    context({
      bundle: true,
      entryPoints: [entry.replace(/^dist\//, '').replace(/\.js$/, '.ts')],
      external: ['n8n-workflow', './DiscordGateway', '../triggers/DiscordGateway'],
      format: 'cjs',
      allowOverwrite: true,
      outfile: entry,
      platform: 'node',
      sourcemap: false,
      target: 'node18',
    }),
  ),
);

contexts.push(
  await context({
    bundle: true,
    entryPoints: ['nodes/triggers/DiscordGateway.ts'],
    external: ['n8n-workflow'],
    format: 'cjs',
    allowOverwrite: true,
    outfile: 'dist/nodes/triggers/DiscordGateway.js',
    platform: 'node',
    sourcemap: false,
    target: 'node18',
  }),
);

await Promise.all(contexts.map((item) => item.watch()));
console.log('Watching TypeScript and bundled node output for changes.');
