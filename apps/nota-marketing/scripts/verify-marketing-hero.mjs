/**
 * Post-build guard: homepage must ship the desktop hero screenshot with priority hints.
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
  ['/desktop-app-screenshot.png', 'hero screenshot asset'],
  ['data-nota-hero-screenshot', 'hero screenshot hook'],
  ['fetchpriority="high"', 'hero image fetch priority'],
  ['alt=', 'hero image alt text'],
  ['mkt-hero-fade mkt-hero-fade-delay-3', 'hero screenshot fade-in'],
  ['mkt-hero-fade mkt-hero-fade-delay-1', 'hero download fade-in'],
  ['mkt-hero-fade mkt-hero-fade-delay-2', 'hero pricing link fade-in'],
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
