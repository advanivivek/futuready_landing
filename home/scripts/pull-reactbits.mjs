// Pulls React Bits components (JS + CSS variant) from the official registry into src/rb/.
// Usage: node scripts/pull-reactbits.mjs GradientASCII Folder ...
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, basename } from 'node:path';
const out = fileURLToPath(new URL('../src/rb/', import.meta.url));
const deps = new Set();
for (const name of process.argv.slice(2)) {
  const res = await fetch(`https://reactbits.dev/r/${name}-JS-CSS.json`);
  if (!res.ok) { console.error('missing', name, res.status); continue; }
  const item = await res.json();
  (item.dependencies || []).forEach(d => deps.add(d));
  for (const f of item.files) {
    const p = join(out, name, basename(f.target || f.path));
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, f.content);
    console.log(name, '->', p.replace(out, ''), f.content.length);
  }
}
console.log('DEPS', [...deps].join(' '));
