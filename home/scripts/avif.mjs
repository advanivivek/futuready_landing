/*
  Gives every story picture and TV screen (public/story/*.webp, public/tv/*.webp) an AVIF twin next to it, about 40%
  lighter at the same look (quality 52, compared side by side at 3x zoom). The build packs the twins for browsers that
  show AVIF (nearly all) and the WebPs for the rest (iPhones on iOS 15 and older); see "pictures" in vite.config.js.

  Run it after adding or changing a picture (a picture without a twin simply travels as WebP):
    node scripts/avif.mjs
  Needs avifenc and dwebp (brew install libavif webp). Only remakes twins older than their WebP.
*/
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const QUALITY = '52'; // colour; alpha (the cut line) gets 90
const tmp = mkdtempSync(join(tmpdir(), 'avif-'));
let made = 0;
let before = 0;
let after = 0;

for (const dir of ['story', 'tv']) {
  const files = readdirSync(join(PUBLIC, dir));
  for (const f of files) {
    const path = join(PUBLIC, dir, f);
    // a twin whose WebP is gone
    if (f.endsWith('.avif') && !files.includes(f.replace(/\.avif$/, '.webp'))) {
      rmSync(path);
      console.log(`removed ${dir}/${f} (its WebP is gone)`);
      continue;
    }
    if (!f.endsWith('.webp')) continue;
    const twin = path.replace(/\.webp$/, '.avif');
    if (!existsSync(twin) || statSync(twin).mtimeMs < statSync(path).mtimeMs) {
      const png = join(tmp, 'p.png');
      execFileSync('dwebp', ['-quiet', path, '-o', png]);
      execFileSync('avifenc', ['-q', QUALITY, '--qalpha', '90', '-s', '4', '-y', '444', png, twin], { stdio: 'ignore' });
      made++;
    }
    before += statSync(path).size;
    after += statSync(twin).size;
  }
}
rmSync(tmp, { recursive: true });
const kb = n => `${Math.round(n / 1024)} KB`;
console.log(`${made} made. All pictures: ${kb(before)} as WebP, ${kb(after)} as AVIF.`);
