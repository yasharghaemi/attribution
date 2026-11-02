// `npm run build:js`: the minified bundle, with settings from .env (see scripts/env.mjs).
import * as esbuild from 'esbuild';
import { buildDefines } from './env.mjs';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2019',
  minify: true,
  sourcemap: true,
  legalComments: 'none',
  outfile: 'dist/pagesetting.min.js',
  define: buildDefines(),
  logLevel: 'info',
});
