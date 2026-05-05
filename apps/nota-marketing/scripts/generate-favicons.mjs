/**
 * Writes `public/favicon.ico` and `public/apple-touch-icon.png` from the stacked-sheet mark
 * (aligned with `public/favicon.svg` geometry, light-tab raster fills).
 *
 * Run from monorepo root: node apps/nota-marketing/scripts/generate-favicons.mjs
 * Requires root dependency `sharp` and workspace devDependency `to-ico`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(__dirname, '../public');

const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="44" height="44">
  <rect x="4" y="4" width="30" height="30" rx="5.5" fill="#171717" fill-opacity="0.35"/>
  <rect x="7" y="7" width="30" height="30" rx="5.5" fill="#171717" fill-opacity="0.7"/>
  <rect x="10" y="10" width="30" height="30" rx="5.5" fill="#171717" fill-opacity="1"/>
</svg>`;

async function main() {
  await fs.promises.mkdir(publicRoot, { recursive: true });

  const png16 = await sharp(Buffer.from(MARK_SVG))
    .resize(16, 16)
    .png()
    .toBuffer();
  const png32 = await sharp(Buffer.from(MARK_SVG))
    .resize(32, 32)
    .png()
    .toBuffer();
  const ico = await toIco([png16, png32]);
  await fs.promises.writeFile(path.join(publicRoot, 'favicon.ico'), ico);

  const markSize = 140;
  const markBuf = await sharp(Buffer.from(MARK_SVG))
    .resize(markSize, markSize)
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: markBuf, gravity: 'centre' }])
    .png()
    .toFile(path.join(publicRoot, 'apple-touch-icon.png'));

  console.log('Wrote public/favicon.ico and public/apple-touch-icon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
