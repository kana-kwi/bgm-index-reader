import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { transform } from 'esbuild';

const source = readFileSync(new URL('./bgm-index-reader.user.js', import.meta.url), 'utf8');
const headerMatch = source.match(/^\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\r?\n/);
if (!headerMatch) throw new Error('UserScript header not found');
const header = headerMatch[0];
let body = source.slice(header.length);

body = body.replace(/var CSS = `([\s\S]*?)`;/, (match, css) => {
  const minified = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
  return 'var CSS = `' + minified + '`;';
});

const result = await transform(body, {
  minify: true,
  target: 'es2017',
  legalComments: 'none'
});

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('./dist/bgm-index-reader.lean.user.js', import.meta.url), header + result.code);
console.log('lean bytes=' + Buffer.byteLength(header + result.code, 'utf8'));