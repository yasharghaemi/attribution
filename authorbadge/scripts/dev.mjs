// Local dev server: `npm run dev` (this computer) or `npm run dev:sandbox` (CodeSandbox).
// Rebuilds authorbadge.js / authorbadge.css on save and serves them, with
// authorbadge.json, from .dev/ on port 8001 (pagesetting's dev server uses 8000).
import * as esbuild from 'esbuild';
import fs from 'node:fs';

const host = process.argv[2] || 'localhost';

const ctx = await esbuild.context({
  entryPoints: ['src/index.ts', 'authorbadge.css'],
  bundle: true,
  format: 'iife',
  target: 'es2019',
  sourcemap: true,
  entryNames: 'authorbadge',
  outdir: '.dev',
  logLevel: 'info',
});
await ctx.watch();

// authorbadge.json is read at runtime: copy it over whenever it changes (if valid).
fs.mkdirSync('.dev', { recursive: true });
const copySettings = () => {
  try {
    JSON.parse(fs.readFileSync('authorbadge.json', 'utf8'));
    fs.copyFileSync('authorbadge.json', '.dev/authorbadge.json');
    console.log('[dev] authorbadge.json updated - reload the page to use it');
  } catch (err) {
    console.error(`[dev] authorbadge.json is not valid JSON, not updated: ${err.message}`);
  }
};
copySettings();
fs.watchFile('authorbadge.json', { interval: 300 }, copySettings);

const { port } = await ctx.serve({ servedir: '.dev', host, port: 8001 });
console.log(`[dev] serving http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`);
