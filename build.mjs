// Builds dist/: a single self-contained index.html (logos inlined as data URIs),
// plus the PWA files and version.json. Run: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';

const version = new Date().toISOString().replace(/\D/g, '').slice(0, 14); // e.g. 20260928123045
const dataUri = f => `data:image/png;base64,${readFileSync(f).toString('base64')}`;

let html = readFileSync('index.html', 'utf8');
const swaps = [
  ["'logo.png?v=3'", `'${dataUri('logo.png')}'`],
  ["'ecclesia-logo.png?v=1'", `'${dataUri('ecclesia-logo.png')}'`],
  ['<meta name="app-version" content="0">', `<meta name="app-version" content="${version}">`],
];
for (const [from, to] of swaps) {
  if (!html.includes(from)) throw new Error(`build: expected text not found: ${from}`);
  html = html.replace(from, () => to);
}

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
writeFileSync('dist/index.html', html);
writeFileSync('dist/Timer.html', html); // same file, friendlier name to hand out
writeFileSync('dist/version.json', JSON.stringify({ v: +version }));
for (const f of ['sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) copyFileSync(f, `dist/${f}`);

console.log(`Built version ${version} (${(html.length / 1024).toFixed(0)} KB)`);
