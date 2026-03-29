/**
 * Regenerates static Open Graph PNGs in public/og/.
 * Run from monorepo root: node apps/nota-marketing/scripts/generate-og.mjs
 * Requires root dependency `sharp`.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/og');

const W = 1200;
const H = 630;

/** Background and decorative layers aligned with HeroLandscape + .mkt-dark */
function decor() {
  return `
  <defs>
    <linearGradient id="mkt-og-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#242424"/>
  <rect width="${W}" height="${H}" fill="url(#mkt-og-sky)"/>
  <circle cx="980" cy="118" r="36" fill="#ffffff" fill-opacity="0.2"/>
  <ellipse cx="820" cy="116" rx="52" ry="14" fill="#ffffff" fill-opacity="0.11"/>
  <ellipse cx="760" cy="130" rx="40" ry="11" fill="#ffffff" fill-opacity="0.09"/>
  <ellipse cx="280" cy="98" rx="64" ry="16" fill="#ffffff" fill-opacity="0.09"/>
  <ellipse cx="220" cy="116" rx="48" ry="12" fill="#ffffff" fill-opacity="0.07"/>
  <path d="M0 412 Q 200 352 420 392 T 840 372 T ${W} 392 L ${W} ${H} L 0 ${H} Z" fill="#ffffff" fill-opacity="0.13"/>
  <path d="M0 452 Q 280 392 520 432 T 1000 412 T ${W} 442 L ${W} ${H} L 0 ${H} Z" fill="#ffffff" fill-opacity="0.19"/>
  <path d="M0 492 Q 340 452 600 482 T ${W} 472 L ${W} ${H} L 0 ${H} Z" fill="#ffffff" fill-opacity="0.26"/>
`;
}

function wrapSvg(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
${body}
</svg>`;
}

async function writePng(filename, svgInner) {
  const buf = await sharp(Buffer.from(wrapSvg(svgInner), 'utf8'))
    .png()
    .toBuffer();
  await fs.promises.writeFile(path.join(outDir, filename), buf);
}

async function main() {
  await fs.promises.mkdir(outDir, { recursive: true });

  const homeInner = `
  ${decor()}
  <text x="72" y="118" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="#a3a3a3" letter-spacing="0.04em">NOTA</text>
  <text x="72" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="52" fill="#fafafa">A quiet corner for your</text>
  <text x="72" y="372" font-family="Georgia, 'Times New Roman', serif" font-size="52" fill="#fafafa">thoughts</text>
  <text x="72" y="456" font-family="ui-sans-serif, system-ui, sans-serif" font-size="26" fill="#a3a3a3">Minimal notes for Mac — without feeds or noise.</text>
`;

  const pricingInner = `
  ${decor()}
  <text x="72" y="118" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="#a3a3a3" letter-spacing="0.04em">NOTA</text>
  <text x="72" y="320" font-family="Georgia, 'Times New Roman', serif" font-size="72" fill="#fafafa">Pricing</text>
  <text x="72" y="408" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28" fill="#a3a3a3">Nota and Nota Pro — simple plans for the Mac app.</text>
`;

  await writePng('home.png', homeInner);
  await writePng('pricing.png', pricingInner);
  console.log('Wrote', path.join(outDir, 'home.png'), 'and pricing.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
