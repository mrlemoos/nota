/**
 * Post-build guard: homepage must ship an accessible autoplay hero video.
 * Run from `apps/nota-marketing` after `astro build`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const htmlPath = join(root, 'dist', 'index.html');

let html;
try {
  html = readFileSync(htmlPath, 'utf8');
} catch {
  console.error(
    'verify-marketing-hero: missing dist/index.html — run astro build first',
  );
  process.exit(1);
}

const checks = [
  ['<video', 'video element'],
  ['data-nota-hero-video', 'hero video hook'],
  ['autoplay', 'autoplay'],
  ['muted', 'muted'],
  ['playsinline', 'playsinline'],
  ['/video/nota-hero.mp4', 'mp4 source'],
  ['aria-label=', 'video aria-label'],
];

for (const [needle, label] of checks) {
  if (!html.includes(needle)) {
    console.error(
      `verify-marketing-hero: expected ${label} (${needle}) in dist/index.html`,
    );
    process.exit(1);
  }
}

console.log('verify-marketing-hero: ok');
