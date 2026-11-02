// `npm run build`: minified, ASCII-only dist/authorbadge.min.js (+ map) and .min.css,
// and a checked copy of authorbadge.json (the build fails if it isn't valid JSON).
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import { buildDefines } from './env.mjs';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2019',
  minify: true,
  sourcemap: true,
  legalComments: 'none',
  outfile: 'dist/authorbadge.min.js',
  define: buildDefines(), // AUTHORS_API_HOST from .env
  logLevel: 'info',
});
await esbuild.build({
  entryPoints: ['authorbadge.css'],
  minify: true,
  outfile: 'dist/authorbadge.min.css',
  logLevel: 'info',
});
JSON.parse(fs.readFileSync('authorbadge.json', 'utf8'));
fs.copyFileSync('authorbadge.json', 'dist/authorbadge.json');
console.log('  dist/authorbadge.json');
