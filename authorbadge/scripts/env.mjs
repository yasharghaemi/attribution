// Build-time settings from pagesetting/.env (git-ignored; see .env.example). A browser
// can't read .env, so the values are written into the bundle with esbuild's `define`.
import fs from 'node:fs';

const DEFAULT_AUTHORS_API_HOST = 'https://knitcanvas.fun';

export function buildDefines() {
  if (fs.existsSync('.env')) process.loadEnvFile('.env');
  const set = (process.env.AUTHORS_API_HOST || '').trim().replace(/\/+$/, '');
  if (set && !/^https?:\/\/[^/]+$/.test(set)) {
    throw new Error(`AUTHORS_API_HOST in .env must look like https://example.org (got "${set}")`);
  }
  const host = set || DEFAULT_AUTHORS_API_HOST;
  console.log(`[env] AUTHORS_API_HOST = ${host}${set ? '' : ' (default; not set in .env)'}`);
  return { __AUTHORS_API_HOST__: JSON.stringify(host) };
}
