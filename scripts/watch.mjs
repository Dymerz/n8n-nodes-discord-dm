import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { build, context } from 'esbuild';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const entries = packageJson.n8n.nodes;

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
